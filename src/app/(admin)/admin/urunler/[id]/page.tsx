import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
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
            className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
          >
            ← Turşu malzemeleri
          </Link>
        ) : (
          <Link
            href="/admin/urunler"
            className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
          >
            ← Ürünler
          </Link>
        )}
      </div>

      <PageHeader
        title={
          isCustomPickle ? "Bidon Boyutları ve Taban Fiyatları" : product.name
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
                  className={buttonVariants({ variant: "outline" })}
                >
                  Malzemeler
                </Link>
                <Link
                  href="/kendi-tursunu-yap"
                  target="_blank"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Turşu yapıcıyı aç ↗
                </Link>
              </>
            ) : product.status === "ACTIVE" ? (
              <Link
                href={`/urun/${product.slug}`}
                className={buttonVariants({ variant: "outline" })}
                target="_blank"
              >
                Mağazada görüntüle ↗
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
        initialTab={
          resolvedSearchParams.tab || (isCustomPickle ? "variants" : "basic")
        }
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
