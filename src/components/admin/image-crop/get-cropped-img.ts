import type { Area } from "react-easy-crop";
import { cropAndOptimizeImage } from "@/components/admin/image-optimize/optimize-image";

/**
 * Kırpma alanını alır, uzun kenarı sınırlar ve tarayıcıda JPEG/WebP olarak sıkıştırır.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  sourceMime?: string,
): Promise<File> {
  return cropAndOptimizeImage({
    imageSrc,
    pixelCrop,
    fileName,
    sourceMime,
  });
}
