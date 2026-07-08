import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const noCacheHeaders = {
  ...corsHeaders,
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

async function shaShort(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", data);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

function cleanHeader(value: string | null, fallback: string, max = 1000): string {
  const text = value?.trim();
  return (text && text.length ? text : fallback).slice(0, max);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-client-ip") ||
    forwarded ||
    "0.0.0.0"
  ).trim();
}

function makeAccessCode(baseCode: string): string {
  return `${baseCode}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { ...noCacheHeaders, Location: location },
  });
}

function isInternalPreview(url: URL): boolean {
  return (
    url.searchParams.get("preview") === "1" ||
    url.searchParams.get("internal_preview") === "1" ||
    url.searchParams.get("as") === "client"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: noCacheHeaders });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Método não permitido", { status: 405, headers: noCacheHeaders });
  }

  const url = new URL(req.url);
  const trackingCode = url.pathname.split("/").filter(Boolean).pop();
  console.log("[track-share] tracking_code recebido:", trackingCode);

  if (!trackingCode || trackingCode === "track-share") {
    return new Response("Código inválido", { status: 400, headers: noCacheHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[track-share] variáveis de backend ausentes");
    return new Response("Configuração indisponível", { status: 500, headers: noCacheHeaders });
  }

  // Usa credencial administrativa para que o rastreamento público anônimo não dependa de sessão/RLS.
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: link, error: lookupError } = await supabase
    .from("share_tracking")
    .select("original_url, lojista_id, vehicle_id")
    .eq("tracking_code", trackingCode)
    .maybeSingle();

  console.log("[track-share] lookup:", { found: !!link, error: lookupError?.message ?? null });

  if (lookupError || !link) {
    return new Response("Link não encontrado", { status: 404, headers: noCacheHeaders });
  }

  let target: string;
  try {
    const parsedTarget = new URL(link.original_url);
    if (!["http:", "https:"].includes(parsedTarget.protocol)) throw new Error("URL inválida");
    target = parsedTarget.toString();
  } catch {
    console.error("[track-share] original_url inválida para redirecionamento");
    return new Response("Destino inválido", { status: 400, headers: noCacheHeaders });
  }

  if (isInternalPreview(url)) {
    console.log("[track-share] prévia interna detectada; acesso ignorado:", trackingCode);
    return redirectTo(target);
  }

  const now = new Date().toISOString();
  const userAgent = cleanHeader(req.headers.get("user-agent"), "unknown");
  const referrer = cleanHeader(req.headers.get("referer"), "direct", 500);
  const clientIp = getClientIp(req);
  const visitorHash = await shaShort(`${clientIp}|${userAgent}`);

  // Cada abertura do link oficial vira uma linha própria de acesso. Assim Android/iOS,
  // múltiplos cliques e links reutilizados contam corretamente; únicos continuam por hash.
  let insertError: { message?: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await supabase.from("share_tracking").insert({
      lojista_id: link.lojista_id,
      vehicle_id: link.vehicle_id,
      original_url: link.original_url,
      tracking_code: makeAccessCode(trackingCode),
      accessed_at: now,
      referrer,
      user_agent: userAgent,
      ip_hash: visitorHash,
    });
    insertError = error;
    if (!error) break;
  }

  if (insertError) {
    console.error("[track-share] falha ao registrar acesso:", insertError.message);
    return new Response("Não foi possível registrar o acesso", {
      status: 500,
      headers: noCacheHeaders,
    });
  }

  // Mantém o contador visual do veículo em sincronia, sem depender de script no front-end.
  const { data: vehicle, error: vehicleReadError } = await supabase
    .from("properties")
    .select("view_count_today")
    .eq("id", link.vehicle_id)
    .maybeSingle();

  if (!vehicleReadError && vehicle) {
    const nextViews = ((vehicle as { view_count_today?: number }).view_count_today ?? 0) + 1;
    const { error: vehicleUpdateError } = await supabase
      .from("properties")
      .update({ view_count_today: nextViews })
      .eq("id", link.vehicle_id);

    if (vehicleUpdateError) {
      console.error("[track-share] acesso registrado, mas contador do veículo não atualizou:", vehicleUpdateError.message);
    }
  } else if (vehicleReadError) {
    console.error("[track-share] acesso registrado, mas veículo não pôde ser lido:", vehicleReadError.message);
  }

  return redirectTo(target);
});
