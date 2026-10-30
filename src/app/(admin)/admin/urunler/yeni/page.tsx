import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Yeni ürün" };

/** Yeni ürün ekleme artık ürün listesindeki modal üzerinden yapılıyor. */
export default function NewProductPage() {
  redirect("/admin/urunler");
}
