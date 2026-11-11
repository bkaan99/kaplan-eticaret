import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getTaxonomyService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { AttributeManager } from "./attribute-manager";

export const metadata: Metadata = { title: "Nitelikler ve Markalar" };

async function AttributesContent() {
  const user = await adminPage(PERMISSIONS.CATALOG_MANAGE);
  if (!user) return <AccessDenied />;

  const service = getTaxonomyService();
  const [attributes, brands] = await Promise.all([
    service.listAttributes(),
    service.listBrands(),
  ]);

  return (
    <AttributeManager
      attributes={attributes.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        isFilterable: attribute.isFilterable,
        values: attribute.values.map((value) => ({
          id: value.id,
          value: value.value,
          productCount: value.productCount,
        })),
      }))}
      brands={brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        productCount: brand.productCount,
      }))}
    />
  );
}

export default function AdminAttributesPage() {
  return (
    <>
      <PageHeader
        title="Nitelikler ve Markalar"
        description="Ürün filtreleri, varyasyon değerleri ve üretici markalarını yönetin. Vitrin filtresi açık nitelikler mağaza aramasında görünür."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/kategoriler"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              Kategoriler
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/admin/urunler"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              Ürünler
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        }
      />
      <Suspense fallback={<AdminLoading label="Nitelikler yükleniyor..." />}>
        <AttributesContent />
      </Suspense>
    </>
  );
}
