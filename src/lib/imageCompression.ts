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

  // ----- Marca d'água -----
  try {
    if (opts.watermarkUrl) {
      const wmImg = await loadImageCORS(opts.watermarkUrl);
      // largura máx ~15% da foto, preservando proporção da imagem (já transparente)
      const wmTargetW = Math.min(wmImg.naturalWidth, Math.round(targetW * 0.15));
      const scale2 = wmTargetW / wmImg.naturalWidth;
      const wmW = Math.round(wmImg.naturalWidth * scale2);
      const wmH = Math.round(wmImg.naturalHeight * scale2);
      const x = Math.round((targetW - wmW) / 2);
      const y = Math.round((targetH - wmH) / 2);
      ctx.globalAlpha = 1.0;
      ctx.drawImage(wmImg, x, y, wmW, wmH);
      ctx.globalAlpha = 1.0;
    } else if (opts.watermarkText) {
      const fontSize = Math.max(28, Math.round(targetW * 0.05));
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = Math.max(2, Math.round(fontSize / 16));
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cx = targetW / 2;
      const cy = targetH / 2;
      ctx.strokeText(opts.watermarkText, cx, cy);
      ctx.fillText(opts.watermarkText, cx, cy);
      ctx.restore();
    }
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
    img.src = url;
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
  const opacity = opts.opacity ?? 0.18;
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
