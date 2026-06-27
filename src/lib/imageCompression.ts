/**
 * Comprime uma imagem para caber dentro de um limite de tamanho e dimensão.
 * Usa <canvas> + toBlob (JPEG/WebP). Fallback: arquivo original se algo falhar.
 *
 * @param file Arquivo original (image/*)
 * @param opts.maxBytes Tamanho máximo final em bytes (default 5MB)
 * @param opts.maxDimension Maior lado em pixels (default 2000)
 * @param opts.qualitySteps Qualidades a tentar, do melhor para o pior
 */
export async function compressImage(
  file: File,
  opts: {
    maxBytes?: number;
    maxDimension?: number;
    qualitySteps?: number[];
    watermarkUrl?: string | null;
    watermarkText?: string | null;
    watermarkImage?: HTMLImageElement | null;
  } = {},
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
  const maxDimension = opts.maxDimension ?? 2000;
  const qualitySteps = opts.qualitySteps ?? [0.85, 0.75, 0.65, 0.5];

  if (!file.type.startsWith("image/")) return file;
  // SVG/GIF: não comprime (perderia animação/vetor)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const bitmap = await loadBitmap(file);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  // ----- Marca d'água (58% largura, centro) -----
  try {
    const watermarkImg = opts.watermarkImage
      ?? (opts.watermarkUrl ? await loadImageCORS(opts.watermarkUrl).catch(() => null) : null);
    if (watermarkImg) {
      // ---- 1) Marca d'água CENTRAL (monocromática, 10% opacidade) ----
      const larguraDesejada = targetW * 0.58;
      const alturaProporcional = (watermarkImg.height * larguraDesejada) / watermarkImg.width;
      const posicaoX = (targetW / 2) - (larguraDesejada / 2);
      const posicaoY = (targetH / 2) - (alturaProporcional / 2);

      // Pré-renderiza versão branca/monocromática do logo num canvas off-screen
      const monoCanvas = document.createElement("canvas");
      monoCanvas.width = Math.max(1, Math.round(larguraDesejada));
      monoCanvas.height = Math.max(1, Math.round(alturaProporcional));
      const monoCtx = monoCanvas.getContext("2d");
      if (monoCtx) {
        // Desenha o logo e força branco preservando o alpha (silhueta branca)
        monoCtx.drawImage(watermarkImg, 0, 0, monoCanvas.width, monoCanvas.height);
        monoCtx.globalCompositeOperation = "source-in";
        monoCtx.fillStyle = "#FFFFFF";
        monoCtx.fillRect(0, 0, monoCanvas.width, monoCanvas.height);
        monoCtx.globalCompositeOperation = "source-over";
      }

      // Sombra sutil para leitura em fundos claros
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.globalAlpha = 0.20;
      ctx.drawImage(monoCtx ? monoCanvas : watermarkImg, posicaoX, posicaoY, larguraDesejada, alturaProporcional);

      // Reseta sombra
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // ---- 2) Logo SECUNDÁRIO (canto superior esquerdo, 65% opacidade) ----
      const cantoLargura = targetW * 0.18;
      const cantoAltura = (watermarkImg.height * cantoLargura) / watermarkImg.width;
      ctx.globalAlpha = 1.0;
      ctx.drawImage(watermarkImg, 25, 25, cantoLargura, cantoAltura);

      ctx.globalAlpha = 1.0;
      console.log("LOG: Marca d'água central (mono 10%) + logo canto (65%) aplicadas.");
    } else if (opts.watermarkText) {
      // Fallback se não tiver imagem
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 56px sans-serif"; // Fonte grande para o fallback
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ Garage", targetW / 2, targetH / 2);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.globalAlpha = 1.0; // Reseta a opacidade do Canvas para o padrão
  } catch {
    // sem marca d'água é OK
  }

  const outType = "image/jpeg";
  for (const q of qualitySteps) {
    const blob = await canvasToBlob(canvas, outType, q);
    if (blob && blob.size <= maxBytes) {
      return new File([blob], renameToJpg(file.name), { type: outType });
    }
  }
  // Se nem na pior qualidade coube, retorna a última versão mesmo assim
  const finalBlob = await canvasToBlob(canvas, outType, qualitySteps[qualitySteps.length - 1]);
  if (finalBlob) return new File([finalBlob], renameToJpg(file.name), { type: outType });
  return file;
}



async function loadBitmap(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

function loadImageCORS(url: string): Promise<HTMLImageElement> {
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
 * Gera um PNG transparente da logo redimensionada (largura máx) e com opacidade fixa.
 * Usado pelo Perfil para pré-processar a marca d'água da loja.
 */
export async function generateWatermarkPng(
  logoUrl: string,
  opts: { maxWidth?: number; opacity?: number } = {},
): Promise<Blob> {
  const maxWidth = opts.maxWidth ?? 200;
  const opacity = opts.opacity ?? 0.75;
  const img = await loadImageCORS(logoUrl);
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = opacity;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.globalAlpha = 1;
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Falha ao gerar PNG");
  return blob;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function renameToJpg(name: string) {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name) + ".jpg";
}
