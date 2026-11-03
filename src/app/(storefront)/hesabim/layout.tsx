import { AccountNav } from "@/components/storefront/account-nav";
import { Reveal } from "@/components/motion/motion";
import { requireUser } from "@/modules/auth/session";

export default async function AccountLayout({
  children,
}: LayoutProps<"/hesabim">) {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <div className="full-bleed -mt-6 min-h-[70vh] bg-[#f3f4ef]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <Reveal y={12} className="border-b border-slate-900/10 pb-6">
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
            Hesabım
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-dark sm:text-4xl">
            Merhaba, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{user.email}</p>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
