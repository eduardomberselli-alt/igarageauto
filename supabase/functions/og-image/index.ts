// Edge Function: og-image
// Gera dinamicamente a imagem Open Graph (PNG 1200x630) padronizada da Garage.
// Identidade: fundo #0A0A0A, dourado #D4AF37, tipografia branca, minimalista.
//
// Endpoints:
//   GET /og-image?store=<slug-ou-userId>
//   GET /og-image?vehicle=<slug-ou-id>[&store=<storeSlug>]
//
// Sem autenticação (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";
const WASM_URL = "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

const BG = "#0A0A0A";
const GOLD = "#D4AF37";
const WHITE = "#FFFFFF";
const MUTED = "#A1A1AA";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------- WASM + Font (carregados uma única vez por instância) ----------------
let wasmReady: Promise<void> | null = null;
let fontBuffer: Uint8Array | null = null;

async function ensureReady() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const wasm = await fetch(WASM_URL).then((r) => r.arrayBuffer());
      await initWasm(wasm);
    })();
  }
  await wasmReady;
  if (!fontBuffer) {
    const buf = await fetch(FONT_URL).then((r) => r.arrayBuffer());
    fontBuffer = new Uint8Array(buf);
  }
}

// ---------------- Helpers ----------------
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Trunca texto com reticências se exceder maxChars. */
function truncate(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars - 1).trimEnd() + "…";
}

/** Calcula font-size automaticamente para caber dentro de maxWidth (estimativa). */
function fitFontSize(text: string, maxWidth: number, baseSize: number, avgCharRatio = 0.55): number {
  const estWidth = text.length * baseSize * avgCharRatio;
  if (estWidth <= maxWidth) return baseSize;
  return Math.max(32, Math.floor((maxWidth / (text.length * avgCharRatio))));
}

function priceBRL(n: number | string | null | undefined): string {
  if (n == null) return "";
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

// ---------------- SVG templates ----------------
function svgFrame(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="goldFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>
  <!-- Moldura sutil dourada -->
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${GOLD}" stroke-opacity="0.18" stroke-width="1"/>
  ${inner}
  <!-- Rodapé: assinatura Garage -->
  <line x1="500" y1="555" x2="700" y2="555" stroke="url(#goldFade)" stroke-width="1"/>
  <text x="600" y="588" text-anchor="middle"
    font-family="Inter, system-ui, sans-serif" font-weight="600"
    font-size="22" letter-spacing="6" fill="${GOLD}">GARAGE</text>
</svg>`;
}

function storeSvg(storeName: string): string {
  const name = truncate(storeName.toUpperCase(), 28);
  const size = fitFontSize(name, 1000, 110, 0.6);
  const desc = "Confira nosso estoque e fale com a nossa equipe.";
  const inner = `
  <text x="600" y="280" text-anchor="middle"
    font-family="Inter, system-ui, sans-serif" font-weight="700"
    font-size="${size}" letter-spacing="4" fill="${WHITE}">${esc(name)}</text>
  <line x1="540" y1="320" x2="660" y2="320" stroke="${GOLD}" stroke-width="2"/>
  <text x="600" y="380" text-anchor="middle"
    font-family="Inter, system-ui, sans-serif" font-weight="400"
    font-size="28" fill="${MUTED}">${esc(desc)}</text>`;
  return svgFrame(inner);
}

function vehicleSvg(args: {
  vehicleName: string;
  year?: number | string | null;
  price?: number | string | null;
  storeName: string;
}): string {
  const vName = truncate(args.vehicleName, 34);
  const vSize = fitFontSize(vName, 1000, 120, 0.55);

  const yp = [args.year ? String(args.year) : "", priceBRL(args.price ?? null)]
    .filter(Boolean)
    .join("  •  ");

  const sName = truncate(args.storeName.toUpperCase(), 32);
  const sSize = fitFontSize(sName, 1000, 64, 0.6);

  const inner = `
  <text x="600" y="220" text-anchor="middle"
    font-family="Inter, system-ui, sans-serif" font-weight="700"
    font-size="${vSize}" fill="${WHITE}">${esc(vName)}</text>
  ${yp ? `<text x="600" y="280" text-anchor="middle"
    font-family="Inter, system-ui, sans-serif" font-weight="500"
    font-size="34" fill="${GOLD}">${esc(yp)}</text>` : ""}
  <line x1="520" y1="340" x2="680" y2="340" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="1"/>
  <text x="600" y="430" text-anchor="middle"
    font-family="Inter, system-ui, sans-serif" font-weight="700"
    font-size="${sSize}" letter-spacing="3" fill="${WHITE}">${esc(sName)}</text>`;
  return svgFrame(inner);
}

// ---------------- Render ----------------
function renderPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, {
    background: BG,
    font: {
      fontBuffers: fontBuffer ? [fontBuffer] : [],
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
    },
    fitTo: { mode: "width", value: 1200 },
  });
  return resvg.render().asPng();
}

// ---------------- Handler ----------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await ensureReady();
    const url = new URL(req.url);
    const storeParam = url.searchParams.get("store");
    const vehicleParam = url.searchParams.get("vehicle");

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    let svg: string | null = null;

    if (vehicleParam) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleParam);
      const q = isUuid
        ? client.from("properties").select("titulo, preco, ano, owner_id").eq("id", vehicleParam)
        : client.from("properties").select("titulo, preco, ano, owner_id").eq("slug", vehicleParam);
      const { data: prop } = await q.maybeSingle();
      if (prop) {
        const { data: prof } = await client
          .from("profiles")
          .select("nome")
          .eq("user_id", prop.owner_id)
          .maybeSingle();
        svg = vehicleSvg({
          vehicleName: String(prop.titulo ?? "Veículo"),
          year: (prop as { ano?: number | string | null }).ano ?? null,
          price: prop.preco,
          storeName: prof?.nome?.trim() || "Loja parceira",
        });
      }
    } else if (storeParam) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeParam);
      const q = isUuid
        ? client.from("profiles").select("nome").eq("user_id", storeParam)
        : client.from("profiles").select("nome").eq("slug", storeParam);
      const { data: prof } = await q.maybeSingle();
      svg = storeSvg(prof?.nome?.trim() || "Garage");
    }

    if (!svg) {
      // Fallback: cartão institucional da marca.
      svg = storeSvg("Garage");
    }

    const png = renderPng(svg);
    return new Response(png, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("og-image error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});