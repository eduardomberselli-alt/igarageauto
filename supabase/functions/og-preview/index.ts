// Edge Function: og-preview
// Gera HTML com Open Graph meta tags dinâmicas para crawlers (Facebook, WhatsApp,
// Twitter, LinkedIn, Slack, etc.). Usuários humanos são redirecionados para o app.
//
// Endpoints:
//   GET /og-preview?p=<slug-ou-userId>     -> portfólio público do corretor
//   GET /og-preview?code=<inviteCode>      -> página de cadastro com convite
//   GET /og-preview?imovel=<id>            -> landing page do imóvel
//
// Não exige autenticação (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// URL pública da app (onde o usuário humano vai parar)
const APP_BASE_URL = "https://garage.app";

// Endpoint que gera dinamicamente a imagem OG padronizada Garage.
const OG_IMAGE_ENDPOINT = `${SUPABASE_URL}/functions/v1/og-image`;
// Imagem institucional (cartão da marca, sem parâmetros).
const BRAND_OG_IMAGE = OG_IMAGE_ENDPOINT;
const DEFAULT_OG_IMAGE = BRAND_OG_IMAGE;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRAWLER_RE = /facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|slackbot|linkedinbot|discordbot|googlebot|bingbot|pinterest|skypeuripreview|embedly|quora link preview|outbrain|vkshare|w3c_validator|redditbot|applebot|preview|fetcher/i;

function isCrawler(ua: string | null): boolean {
  if (!ua) return true; // sem UA -> trata como crawler (mais seguro)
  return CRAWLER_RE.test(ua);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Acrescenta um query param de cache-buster para forçar o WhatsApp/Facebook a atualizar a prévia. */
function withVersion(url: string, version: string | null | undefined): string {
  if (!url) return url;
  if (!version) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(version)}`;
}

function ogStoreImage(slug: string, version?: string | null): string {
  return withVersion(`${OG_IMAGE_ENDPOINT}?store=${encodeURIComponent(slug)}`, version);
}
function ogVehicleImage(idOrSlug: string, version?: string | null): string {
  return withVersion(`${OG_IMAGE_ENDPOINT}?vehicle=${encodeURIComponent(idOrSlug)}`, version);
}

function buildHtml(args: {
  title: string;
  description: string;
  image: string;
  canonical: string;
  redirect: string;
}): string {
  const { title, description, image, canonical, redirect } = args;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImg = escapeHtml(image);
  const safeUrl = escapeHtml(canonical);
  const safeRedirect = escapeHtml(redirect);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImg}" />
    <meta property="og:image:secure_url" content="${safeImg}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${safeTitle}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="Garage" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImg}" />

    <link rel="canonical" href="${safeUrl}" />
    <meta http-equiv="refresh" content="0; url=${safeRedirect}" />
  </head>
  <body>
    <p>Redirecionando para <a href="${safeRedirect}">${safeRedirect}</a>...</p>
    <script>window.location.replace(${JSON.stringify(redirect)});</script>
  </body>
</html>`;
}

/** Calcula o selo do corretor baseado em propriedades + certificações. */
async function computeBadge(
  client: ReturnType<typeof createClient>,
  userId: string,
): Promise<"MASTER" | "EXPERT" | "SELECT"> {
  const [{ count: propsCount }, { count: certsCount }] = await Promise.all([
    client.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", userId),
    client.from("certifications").select("*", { count: "exact", head: true }).eq("owner_id", userId),
  ]);
  const total = (propsCount ?? 0) + (certsCount ?? 0);
  if (total >= 10) return "MASTER";
  if (total >= 5) return "EXPERT";
  return "SELECT";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ua = req.headers.get("user-agent");
    const slug = url.searchParams.get("p");
    const code = url.searchParams.get("code");
    const imovelId = url.searchParams.get("imovel");
    // `route` permite forçar a prévia de uma rota institucional (home/auth)
    // mesmo sem parâmetros específicos. Ex.: /og-preview?route=auth
    const route = (url.searchParams.get("route") ?? "").toLowerCase();

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    // Default = prévia institucional (Home / Auth) com a marca Garage.
    let title = "Garage";
    let description =
      "Landing page por veículo + portfólio com selo de autoridade. Premium e GRATUITO para lojistas.";
    let image = BRAND_OG_IMAGE;
    let canonical = APP_BASE_URL;
    let redirect = APP_BASE_URL;

    // -------- Caso 0: rota institucional explícita (home/auth) --------
    if (!code && !slug && !imovelId && (route === "auth" || route === "home" || route === "")) {
      if (route === "auth") {
        canonical = `${APP_BASE_URL}/auth`;
        redirect = canonical;
      }
      // título/descrição/imagem já são os defaults da marca acima.
    }

    // -------- Caso 1: convite de cadastro --------
    if (code) {
      const { data: inv } = await client
        .from("invites")
        .select("inviter_id, status")
        .eq("code", code)
        .maybeSingle();

      if (inv?.inviter_id && inv.status === "pending") {
        const { data: prof } = await client
          .from("profiles")
          .select("nome, slug, updated_at")
          .eq("user_id", inv.inviter_id)
          .maybeSingle();

        const badge = await computeBadge(client, inv.inviter_id);
        const nome = prof?.nome?.trim() || "Corretor";
        title = `${nome} — Garage`;
        description = `Selo ${badge} · ${nome} está te convidando para a Garage, plataforma boutique de lojistas. É gratuito.`;
        image = prof?.slug
          ? ogStoreImage(prof.slug, prof.updated_at)
          : BRAND_OG_IMAGE;
      } else {
        title = "Convite — Garage";
        description = "Cadastre-se com um código de convite e ganhe acesso à plataforma boutique.";
      }
      canonical = `${APP_BASE_URL}/register?code=${encodeURIComponent(code)}`;
      redirect = canonical;
    }

    // -------- Caso 2: portfólio público / vitrine da loja --------
    else if (slug) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const profQuery = isUuid
        ? client.from("profiles").select("user_id, nome, slug, updated_at").eq("user_id", slug)
        : client.from("profiles").select("user_id, nome, slug, updated_at").eq("slug", slug);
      const { data: prof } = await profQuery.maybeSingle();

      if (prof?.user_id) {
        const nome = prof.nome?.trim() || "Loja parceira";
        title = nome;
        description = "Confira nosso estoque e fale com a nossa equipe.";
        image = ogStoreImage(prof.slug ?? slug, prof.updated_at);
      }
      canonical = `${APP_BASE_URL}/p/${encodeURIComponent(slug)}`;
      redirect = canonical;
    }

    // -------- Caso 3: veículo público (por id ou por slug) --------
    else if (imovelId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imovelId);
      const propQuery = isUuid
        ? client
            .from("properties")
            .select("id, titulo, preco, owner_id, updated_at, slug")
            .eq("id", imovelId)
        : client
            .from("properties")
            .select("id, titulo, preco, owner_id, updated_at, slug")
            .eq("slug", imovelId);
      const { data: prop } = await propQuery.maybeSingle();

      if (prop) {
        const { data: prof } = await client
          .from("profiles")
          .select("nome, slug, updated_at")
          .eq("user_id", prop.owner_id)
          .maybeSingle();
        const nome = prof?.nome?.trim() || "Loja parceira";
        const precoFmt = Number(prop.preco).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        });
        title = `${prop.titulo} • ${precoFmt}`;
        description = nome;
        image = ogVehicleImage(prop.slug ?? prop.id, prop.updated_at);
        if (prof?.slug && prop.slug) {
          canonical = `${APP_BASE_URL}/${encodeURIComponent(prof.slug)}/${encodeURIComponent(prop.slug)}`;
        } else {
          canonical = `${APP_BASE_URL}/imovel/${encodeURIComponent(imovelId)}`;
        }
        redirect = canonical;
      } else {
        canonical = `${APP_BASE_URL}/imovel/${encodeURIComponent(imovelId)}`;
        redirect = canonical;
      }
    }

    // Crawler -> HTML com OG tags. Humano -> redirect 302 direto.
    if (isCrawler(ua)) {
      const html = buildHtml({ title, description, image, canonical, redirect });
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          // Cache curto para crawlers respeitarem mudanças de foto rapidamente.
          "Cache-Control": "public, max-age=120, s-maxage=120",
        },
      });
    }

    return Response.redirect(redirect, 302);
  } catch (err) {
    console.error("og-preview error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
