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
    watermarkOpacity?: number;
    watermarkScale?: number; // largura da logo relativa à largura da foto (0-1)
    watermarkPosition?: "bottom-right" | "bottom-left";
  } = {},
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
  const maxDimension = opts.maxDimension ?? 2000;
  const qualitySteps = opts.qualitySteps ?? [0.85, 0.75, 0.65, 0.5];
  const watermarkOpacity = opts.watermarkOpacity ?? 0.8;
  const watermarkScale = opts.watermarkScale ?? 0.18;
  const watermarkPosition = opts.watermarkPosition ?? "bottom-right";
  const hasWatermark = !!(opts.watermarkUrl || opts.watermarkText);

  if (!file.type.startsWith("image/")) return file;
  // SVG/GIF: não comprime (perderia animação/vetor)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  // Já cabe e não precisa redimensionar? Tenta evitar trabalho.
  const bitmap = await loadBitmap(file);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  // Se já cabe E não precisa redimensionar E não há marca d'água, retorna original.
  if (file.size <= maxBytes && scale === 1 && !hasWatermark) {
    bitmap.close?.();
    return file;
  }

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

  // Aplica marca d'água (logo da loja ou texto fallback)
  if (hasWatermark) {
    try {
      await drawWatermark(ctx, targetW, targetH, {
        url: opts.watermarkUrl ?? null,
        text: opts.watermarkText ?? null,
        opacity: watermarkOpacity,
        scale: watermarkScale,
        position: watermarkPosition,
      });
    } catch {
      // ignora falhas de marca d'água
    }
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

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: {
    url: string | null;
    text: string | null;
    opacity: number;
    scale: number;
    position: "bottom-right" | "bottom-left";
  },
) {
  const padding = Math.round(Math.min(W, H) * 0.025);
  ctx.save();
  ctx.globalAlpha = opts.opacity;

  let drewImage = false;
  if (opts.url) {
    const img = await loadImage(opts.url);
    if (img) {
      const targetW = Math.round(W * opts.scale);
      const ratio = img.naturalHeight / img.naturalWidth || 1;
      const targetH = Math.round(targetW * ratio);
      const x = opts.position === "bottom-right" ? W - targetW - padding : padding;
      const y = H - targetH - padding;

      // Sombra discreta para contraste em fundos claros
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = Math.max(4, Math.round(W * 0.004));
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.drawImage(img, x, y, targetW, targetH);
      drewImage = true;
    }
  }

  if (!drewImage) {
    // Fallback textual: "Garage" ou texto fornecido
    const label = opts.text || "Garage";
    const fontSize = Math.max(14, Math.round(W * 0.028));
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.max(4, Math.round(W * 0.004));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#D4AF37"; // dourado do brand
    const metrics = ctx.measureText(label);
    const x =
      opts.position === "bottom-right"
        ? W - metrics.width - padding
        : padding;
    const y = H - padding;
    ctx.fillText(label, x, y);
  }

  ctx.restore();
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // bust de cache leve para garantir CORS consistente
    img.src = url;
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function renameToJpg(name: string) {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name) + ".jpg";
}
