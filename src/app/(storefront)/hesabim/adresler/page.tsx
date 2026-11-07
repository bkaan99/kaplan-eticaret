import type { Metadata } from "next";
import { Suspense } from "react";
import { getAddressService } from "@/modules/account/container";
import { requireUser } from "@/modules/auth/session";
import { AddressManager } from "./address-manager";

export const metadata: Metadata = {
  title: "Adreslerim",
  robots: { index: false },
};

async function AddressesContent() {
  const user = await requireUser();
  const addresses = await getAddressService().list(user.id);
  return <AddressManager addresses={addresses} />;
}

export default function AddressesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-900/10 pb-3">
        <h2 className="font-display text-xl font-semibold text-brand-dark">
          Adreslerim
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Teslimat ve fatura adreslerinizi yönetin.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}
      >
        <AddressesContent />
      </Suspense>
    </div>
  );
}
