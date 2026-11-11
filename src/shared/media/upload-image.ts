import { prepareImageUpload } from "./prepare-image-upload";

/** Admin görsel yükleme: önce istemci tarafı resize, sonra /admin/yukle. */
export async function uploadImageFile(
  file: File,
): Promise<{ url: string } | { error: string }> {
  const prepared = await prepareImageUpload(file);
  const body = new FormData();
  body.set("file", prepared);

  try {
    const response = await fetch("/admin/yukle", { method: "POST", body });
    const result = (await response.json()) as {
      url?: string;
      error?: string;
    };
    if (!response.ok || !result.url) {
      return { error: result.error ?? "Yükleme başarısız" };
    }
    return { url: result.url };
  } catch {
    return { error: "Yükleme başarısız, bağlantınızı kontrol edin" };
  }
}
