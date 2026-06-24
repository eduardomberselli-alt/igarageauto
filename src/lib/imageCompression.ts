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
    watermarkOpacity?: number; // 0..1
    watermarkScale?: number;   // fração do lado da área-segura (default 0.28)
  } = {},
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
  const maxDimension = opts.maxDimension ?? 2000;
  const qualitySteps = opts.qualitySteps ?? [0.85, 0.75, 0.65, 0.5];
  const watermarkUrl = opts.watermarkUrl ?? null;
  const watermarkOpacity = clamp(opts.watermarkOpacity ?? 0.8, 0, 1);
  const watermarkScale = clamp(opts.watermarkScale ?? 0.28, 0.05, 0.6);

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

  // Marca d'água (logo da loja) — desenhada em "área-segura" central
  if (watermarkUrl) {
    try {
      const wm = await loadWatermarkImage(watermarkUrl);
      drawWatermarkSafeArea(ctx, targetW, targetH, wm, {
        opacity: watermarkOpacity,
        scale: watermarkScale,
      });
    } catch (err) {
      console.warn("[watermark] falhou ao carregar/desenhar logo:", err);
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Carrega a logo com CORS habilitado para uso seguro no Canvas.
 * Fallback via fetch → blob → ObjectURL caso o servidor não responda CORS no <img>.
 */
function loadWatermarkImage(url: string): Promise<HTMLImageElement> {
  const bust = url + (url.includes("?") ? "&" : "?") + "wm=1";
  const direct = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = async () => {
      try { await img.decode?.(); } catch { /* ignore */ }
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = bust;
  });

  return direct.catch(async () => {
    const res = await fetch(bust, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`watermark fetch ${res.status}`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objUrl;
      });
    } finally {
      // Libera após decode (próximo tick)
      setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    }
  });
}

/**
 * Desenha a logo dentro do quadrado central (área-segura) da imagem.
 * Isso garante visibilidade tanto na miniatura (carrossel com object-cover quadrado)
 * quanto no fullscreen, independentemente da proporção original.
 * Posição: rodapé do quadrado central, horizontalmente centralizado.
 */
function drawWatermarkSafeArea(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  logo: HTMLImageElement,
  { opacity, scale }: { opacity: number; scale: number },
) {
  const safe = Math.min(W, H); // lado do quadrado central visível em qualquer crop quadrado
  const safeLeft = (W - safe) / 2;
  const safeTop = (H - safe) / 2;
  const safeRight = safeLeft + safe;
  const safeBottom = safeTop + safe;

  // Largura alvo da marca d'água
  const targetW = Math.round(safe * scale);
  const ratio = logo.naturalHeight / logo.naturalWidth || 1;
  const targetH = Math.round(targetW * ratio);

  const margin = Math.round(safe * 0.04);
  const x = Math.round((safeLeft + safeRight) / 2 - targetW / 2);
  const y = Math.round(safeBottom - targetH - margin);

  ctx.save();
  ctx.globalAlpha = opacity;
  // Sombra suave para destacar a logo em fundos claros e escuros
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.max(6, Math.round(safe * 0.008));
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, Math.round(safe * 0.002));
  ctx.drawImage(logo, x, y, targetW, targetH);
  ctx.restore();
}
