"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const LINKS: readonly { href: string; label: string; exact?: boolean }[] = [
  { href: "/hesabim", label: "Siparişlerim", exact: true },
  { href: "/hesabim/adresler", label: "Adreslerim" },
  { href: "/hesabim/ayarlar", label: "Hesap ayarları" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hesap menüsü" className="flex flex-col gap-6">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={`flex min-h-11 items-center rounded-full px-4 py-2.5 text-sm font-semibold transition lg:min-h-0 lg:rounded-none lg:border-l-2 lg:px-3 lg:py-2.5 ${
                  active
                    ? "bg-primary text-white lg:border-brand-gold lg:bg-transparent lg:text-primary"
                    : "text-slate-600 hover:text-brand-dark lg:border-transparent lg:hover:border-slate-300"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <AdminLogoutButton
        variant="minimal"
        className="w-fit px-4 text-sm font-semibold text-slate-500 no-underline hover:text-brand-pepper lg:px-3"
      />
    </nav>
  );
}
