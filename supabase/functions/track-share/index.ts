import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function md5Short(input: string): Promise<string> {
  // Web Crypto não suporta MD5; usamos SHA-1 e cortamos para 8 chars (suficiente para hash de IP anônimo).
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", data);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 8);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const trackingCode = url.pathname.split("/").filter(Boolean).pop();
  const wantsJson =
    url.searchParams.get("format") === "json" ||
    (req.headers.get("accept") || "").toLowerCase().includes("application/json");
  console.log("[track-share] tracking_code recebido:", trackingCode, "json:", wantsJson);

  if (!trackingCode || trackingCode === "track-share") {
    return new Response(
      wantsJson ? JSON.stringify({ error: "invalid_code" }) : "Código inválido",
      {
        status: 400,
        headers: wantsJson
          ? { ...corsHeaders, "Content-Type": "application/json" }
          : corsHeaders,
      },
    );
  }

  // Usa SERVICE_ROLE para ignorar RLS (acesso público anônimo via browser)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: link, error } = await supabase
    .from("share_tracking")
    .select("original_url, lojista_id, vehicle_id")
    .eq("tracking_code", trackingCode)
    .maybeSingle();

  console.log("[track-share] lookup:", { found: !!link, error });

  if (error || !link) {
    return new Response(
      wantsJson ? JSON.stringify({ error: "not_found" }) : "Link não encontrado",
      {
        status: 404,
        headers: wantsJson
          ? { ...corsHeaders, "Content-Type": "application/json" }
          : corsHeaders,
      },
    );
  }

  const ipRaw =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    "0.0.0.0";
  const ipHash = await md5Short(ipRaw.split(",")[0].trim());

  // Atualiza o registro existente com o último acesso.
  await supabase
    .from("share_tracking")
    .update({
      accessed_at: new Date().toISOString(),
      referrer: req.headers.get("referer") || "direct",
      user_agent: req.headers.get("user-agent") || "unknown",
      ip_hash: ipHash,
    })
    .eq("tracking_code", trackingCode);

  if (wantsJson) {
    return new Response(
      JSON.stringify({ original_url: link.original_url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: link.original_url },
  });
});
