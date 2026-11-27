/** Admin yüklemelerinde tarayıcıda boyut + sıkıştırma (Workers’ta Sharp yok). */

export const DEFAULT_MAX_EDGE = 1600;
export const DEFAULT_QUALITY = 0.82;

export interface OptimizeImageOptions {
  /** Uzun kenar üst sınırı (px). Varsayılan 1600. */
  maxEdge?: number;
  /** JPEG/WebP kalitesi 0–1. Varsayılan 0.82. */
  quality?: number;
  /** PNG şeffaflığını koru (varsayılan: kaynak PNG ise true). */
  preferPng?: boolean;
}

export function scaleToMaxEdge(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return { width: w, height: h };
  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  };
}

function supportsWebp(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Görsel yüklenemedi")),
    );
    image.src = src;
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.addEventListener("load", () => {
      URL.revokeObjectURL(url);
      resolve(image);
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel yüklenemedi"));
    });
    image.src = url;
  });
}

async function canvasToFile(
  canvas: HTMLCanvasElement,
  baseName: string,
  preferPng: boolean,
  quality: number,
): Promise<File> {
  const usePng = preferPng;
  const useWebp = !usePng && supportsWebp();
  const mime = usePng ? "image/png" : useWebp ? "image/webp" : "image/jpeg";
  const extension = usePng ? "png" : useWebp ? "webp" : "jpg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Görsel sıkıştırılamadı"));
          return;
        }
        resolve(result);
      },
      mime,
      usePng ? undefined : quality,
    );
  });

  return new File([blob], `${baseName}-opt.${extension}`, { type: mime });
}

export async function encodeCanvasImage(
  canvas: HTMLCanvasElement,
  fileName: string,
  options: OptimizeImageOptions = {},
): Promise<File> {
  const quality = options.quality ?? DEFAULT_QUALITY;
  const preferPng = options.preferPng ?? false;
  const baseName = fileName.replace(/\.[^.]+$/, "") || "gorsel";
  return canvasToFile(canvas, baseName, preferPng, quality);
}

/**
 * Dosyayı tarayıcıda yeniden boyutlandırıp JPEG/WebP (veya şeffaf PNG) olarak sıkıştırır.
 * Zaten küçükse yine yeniden encode eder (kalite düşümü).
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const preferPng = options.preferPng ?? file.type === "image/png";

  const image = await loadImageFromFile(file);
  const { width, height } = scaleToMaxEdge(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxEdge,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor");

  if (!preferPng) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(image, 0, 0, width, height);

  return encodeCanvasImage(canvas, file.name, { quality, preferPng });
}

export async function cropAndOptimizeImage(input: {
  imageSrc: string;
  pixelCrop: { x: number; y: number; width: number; height: number };
  fileName: string;
  sourceMime?: string;
  maxEdge?: number;
  quality?: number;
}): Promise<File> {
  const image = await loadImageFromSrc(input.imageSrc);
  const maxEdge = input.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = input.quality ?? DEFAULT_QUALITY;
  const preferPng = input.sourceMime === "image/png";

  const cropW = Math.max(1, Math.round(input.pixelCrop.width));
  const cropH = Math.max(1, Math.round(input.pixelCrop.height));
  const { width, height } = scaleToMaxEdge(cropW, cropH, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor");

  if (!preferPng) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(
    image,
    input.pixelCrop.x,
    input.pixelCrop.y,
    input.pixelCrop.width,
    input.pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  return encodeCanvasImage(canvas, input.fileName, { quality, preferPng });
}
