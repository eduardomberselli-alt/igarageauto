import { supabase } from "@/integrations/supabase/client";
import type { Profile, Property } from "@/types";
import { formatBRL } from "@/lib/format";

/**
 * Assinatura usada para detectar se o card do veículo precisa ser regerado.
 * Inclui dados que aparecem visualmente no card (preço, modelo/título, ano,
 * cidade, loja e foto de capa).
 */
export function buildVehicleCardSignature(
  property: Pick<Property, "preco" | "titulo" | "year" | "city" | "bairro" | "fotoUrl"> & { fotoUrl?: string | null },
  profile?: Pick<Profile, "nome" | "logoLojaUrl"> | null,
): string {
  return [
    "v1",
    Math.round(Number(property.preco) || 0),
    (property.titulo || "").trim().toLowerCase(),
    property.year ?? "",
    (property.city || property.bairro || "").trim().toLowerCase(),
    (profile?.nome || "").trim().toLowerCase(),
    property.fotoUrl || "",
    profile?.logoLojaUrl || "",
  ].join("|");
}

function loadImageCors(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    const sep = url.includes("?") ? "&" : "?";
    img.src = `${url}${sep}cb=${Date.now()}`;
  });
}

/**
 * Desenha o card de compartilhamento (1200x630) para um veículo e devolve o Blob JPEG.
 * Layout: foto de capa em cover (com escurecimento na base) + tarja inferior com
 * preço em destaque, nome do veículo (modelo/ano), nome da loja e cidade.
 */
export async function renderVehicleCardBlob(
  property: Property,
  profile?: Profile | null,
): Promise<Blob> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  // Fundo: foto de capa (cover) ou gradiente fallback
  const cover = property.fotoUrl || property.fotosUrls?.[0] || "";
  let drewCover = false;
  if (cover) {
    try {
      const img = await loadImageCors(cover);
      const ratio = Math.max(W / img.width, H / img.height);
      const bw = img.width * ratio;
      const bh = img.height * ratio;
      ctx.drawImage(img, (W - bw) / 2, (H - bh) / 2, bw, bh);
      drewCover = true;
    } catch {
      /* fallback abaixo */
    }
  }
  if (!drewCover) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1a1a1a");
    g.addColorStop(1, "#3a1f25");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Tarja escura na base com gradiente
  const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.78)");
  grad.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const padX = 56;
  const baseY = H - 48;

  // Linha 3 (inferior): loja • cidade
  const storeName = (profile?.nome || "").trim();
  const cidade = (property.city || property.bairro || "").trim();
  const linhaLoja = [storeName, cidade].filter(Boolean).join(" • ");
  if (linhaLoja) {
    ctx.fillStyle = "rgba(220,220,220,0.9)";
    ctx.font = "500 26px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(linhaLoja, padX, baseY);
  }

  // Linha 2: nome do veículo (titulo + ano)
  const ano = property.year ? ` ${property.year}` : "";
  const titulo = `${(property.titulo || "").trim()}${ano}`.trim();
  if (titulo) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 44px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(truncate(ctx, titulo, W - padX * 2), padX, baseY - 44);
  }

  // Linha 1 (preço em destaque, dourado)
  const preco = formatBRL(Number(property.preco) || 0);
  ctx.fillStyle = "#D4AF37";
  ctx.font = "800 92px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(preco, padX, baseY - 110);

  const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.9));
  if (!blob) throw new Error("Falha ao gerar imagem do card");
  return blob;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ell = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid) + ell).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ell;
}

/**
 * Garante que o card do veículo está atualizado: se a assinatura mudou (preço,
 * modelo, ano, etc.) ou se ainda não existe `url_card_whatsapp`, regera o card,
 * faz upload no Storage e atualiza as colunas na tabela `properties`.
 * Retorna a URL pública atualizada (ou a existente se nada mudou).
 */
export async function ensureVehicleCard(
  property: Property,
  profile?: Profile | null,
  opts?: { force?: boolean },
): Promise<string | null> {
  if (!property?.id) return null;
  const signature = buildVehicleCardSignature(property, profile);
  const needsRegen =
    opts?.force ||
    !property.urlCardWhatsapp ||
    property.cardSignature !== signature;
  if (!needsRegen) return property.urlCardWhatsapp ?? null;

  try {
    const blob = await renderVehicleCardBlob(property, profile);
    const path = `${property.ownerId}/vehicles/${property.id}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { cacheControl: "3600", upsert: true, contentType: "image/jpeg" });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const { error: updErr } = await supabase
      .from("properties")
      .update({
        url_card_whatsapp: publicUrl,
        card_signature: signature,
      } as never)
      .eq("id", property.id);
    if (updErr) throw updErr;

    return publicUrl;
  } catch (e) {
    console.error("ensureVehicleCard falhou", e);
    return property.urlCardWhatsapp ?? null;
  }
}