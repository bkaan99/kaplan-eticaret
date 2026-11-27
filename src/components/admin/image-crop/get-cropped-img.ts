import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Görsel yüklenemedi")),
    );
    image.src = src;
  });
}

/**
 * react-easy-crop piksel alanından kırpılmış bir File üretir.
 * Şeffaflık gereken PNG kaynaklarda PNG, aksi halde JPEG kullanır.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  sourceMime?: string,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas desteklenmiyor");
  }

  const width = Math.max(1, Math.round(pixelCrop.width));
  const height = Math.max(1, Math.round(pixelCrop.height));
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  const preferPng = sourceMime === "image/png";
  const mime = preferPng ? "image/png" : "image/jpeg";
  const quality = preferPng ? undefined : 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Kırpılmış görsel oluşturulamadı"));
          return;
        }
        resolve(result);
      },
      mime,
      quality,
    );
  });

  const baseName = fileName.replace(/\.[^.]+$/, "") || "gorsel";
  const extension = preferPng ? "png" : "jpg";
  return new File([blob], `${baseName}-kirpilmis.${extension}`, { type: mime });
}
