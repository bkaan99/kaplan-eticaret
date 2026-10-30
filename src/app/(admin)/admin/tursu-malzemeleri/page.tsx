import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { adminPage } from "@/modules/admin/guard";
import { customPickleService } from "@/modules/custom-pickle/container";
import { PERMISSIONS } from "@/shared/permissions";
import { IngredientManager } from "./ingredient-manager";

export const metadata: Metadata = { title: "Kendi turşunu yap" };

async function IngredientsContent() {
  const user = await adminPage(PERMISSIONS.PRODUCT_WRITE);
  if (!user) return <AccessDenied />;

  const [ingredients, productId, options] = await Promise.all([
    customPickleService.listIngredients(),
    customPickleService.builderProductId(),
    customPickleService.getOptions(),
  ]);
  return (
    <IngredientManager
      ingredients={ingredients}
      productId={productId}
      initialOptions={options}
    />
  );
}

export default function AdminPickleIngredientsPage() {
  return (
    <>
      <PageHeader
        title="Kendi turşunu yap"
        description="Müşterilerin bidona ekleyebileceği malzemeler. Ek ücret bidonun kilogramı başınadır: 5 kg bidonda 4 TL/kg olan malzeme +20 TL ekler."
        actions={
          <Link
            href="/kendi-tursunu-yap"
            target="_blank"
            className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sayfayı görüntüle ↗
          </Link>
        }
      />
      <Suspense
        fallback={<AdminLoading />}
      >
        <IngredientsContent />
      </Suspense>
    </>
  );
}
