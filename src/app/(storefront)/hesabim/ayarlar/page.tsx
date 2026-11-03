import type { Metadata } from "next";
import { Suspense } from "react";
import {
  accountSecondaryBtn,
} from "@/components/storefront/account-ui";
import { getProfileService } from "@/modules/account/container";
import { requireUser } from "@/modules/auth/session";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = {
  title: "Hesap ayarları",
  robots: { index: false },
};

async function SettingsContent() {
  const user = await requireUser();
  const stored = await getProfileService().getProfile(user.id);
  const profile = {
    email: stored.email,
    firstName: stored.firstName,
    lastName: stored.lastName,
    phone: stored.phone ?? "",
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-brand-dark">
          Kişisel bilgiler
        </h2>
        <ProfileForm {...profile} />
      </section>

      <section className="flex flex-col gap-4 border-t border-slate-900/10 pt-10">
        <h2 className="font-display text-xl font-semibold text-brand-dark">
          Parola
        </h2>
        <PasswordForm />
      </section>

      <section className="flex flex-col gap-3 border-t border-slate-900/10 pt-10">
        <h2 className="font-display text-xl font-semibold text-brand-dark">
          Verilerim
        </h2>
        <p className="max-w-md text-sm text-slate-600">
          Hesabınızda tuttuğumuz kişisel verilerin bir kopyasını JSON olarak
          indirebilirsiniz.
        </p>
        <a href="/hesabim/verilerim" download className={accountSecondaryBtn}>
          Verilerimi indir
        </a>
      </section>

      <section className="flex flex-col gap-4 border-t border-slate-900/10 pt-10">
        <h2 className="font-display text-xl font-semibold text-brand-pepper">
          Hesabı sil
        </h2>
        <DeleteAccountForm />
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-900/10 pb-3">
        <h2 className="font-display text-xl font-semibold text-brand-dark">
          Hesap ayarları
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Profil, güvenlik ve gizlilik tercihleriniz.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}
