import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getTaxonomyService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { flattenWithDepth } from "@/modules/admin/taxonomy/category.logic";
import { PERMISSIONS } from "@/shared/permissions";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Kategori Yönetimi" };

async function CategoriesContent() {
  const user = await adminPage(PERMISSIONS.CATALOG_MANAGE);
  if (!user) return <AccessDenied />;

  const categories = await getTaxonomyService().listCategories();
  return <CategoryManager categories={flattenWithDepth(categories)} />;
}

export default function AdminCategoriesPage() {
  return (
    <>
      <PageHeader
        title="Kategori Yönetimi"
        description="Mağaza ürün kategorileri, hiyerarşik ağaç yapısı, sıralama ve SEO ayarları."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <span>Mağazada Görüntüle</span>
              <span className="text-slate-400">↗</span>
            </Link>
          </div>
        }
      />
      <Suspense fallback={<AdminLoading />}>
        <CategoriesContent />
      </Suspense>
    </>
  );
}
