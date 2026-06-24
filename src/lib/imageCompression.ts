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
