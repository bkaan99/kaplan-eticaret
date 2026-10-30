import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getProductAdminService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS } from "@/shared/permissions";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Ürün ve Bidon Boyutu Düzenle" };

async function EditProductContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string; focus?: string }>;
}) {
  const user = await adminPage(PERMISSIONS.PRODUCT_WRITE);
  if (!user) return <AccessDenied />;

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const service = getProductAdminService();

  let product;
  try {
    product = await service.get(id);
  } catch (error) {
    if (isAppError(error)) notFound();
    throw error;
  }

  const references = await service.references();
  const isCustomPickle = product.slug === "kendi-tursunu-yap";

  return (
    <>
      <div className="mb-4">
        {isCustomPickle ? (
          <Link
            href="/admin/tursu-malzemeleri"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <span>← Turşu Malzemeleri ve Reçetelerine Dön</span>
          </Link>
        ) : (
          <Link
            href="/admin/urunler"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <span>← Tüm Ürünlere Dön</span>
          </Link>
        )}
      </div>

      <PageHeader
        title={
          isCustomPickle
            ? "Bidon Boyutları ve Taban Fiyatları"
            : product.name
        }
        description={
          isCustomPickle
            ? "Müşterilerin 'Kendi Turşunu Yap' sayfasında seçeceği kavanoz ve bidon seçenekleri ile taban ücretleri."
            : `/urun/${product.slug}`
        }
        actions={
          <div className="flex items-center gap-2">
            {isCustomPickle ? (
              <>
                <Link
                  href="/admin/tursu-malzemeleri"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  <span>🥗 Malzemeler</span>
                </Link>
                <Link
                  href="/kendi-tursunu-yap"
                  target="_blank"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-3.5 text-xs font-semibold text-slate-950 shadow-2xs hover:bg-amber-400"
                >
                  <span>Turşu Yapıcıyı Aç ↗</span>
                </Link>
              </>
            ) : product.status === "ACTIVE" ? (
              <Link
                href={`/urun/${product.slug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                target="_blank"
              >
                <span>Sayfayı Görüntüle ↗</span>
              </Link>
            ) : null}
          </div>
        }
      />

      <ProductForm
        key={product.id}
        mode="edit"
        product={product}
        references={references}
        initialTab={resolvedSearchParams.tab || (isCustomPickle ? "variants" : "basic")}
      />
    </>
  );
}

export default function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/urunler/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditProductContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
