"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface HeaderNavItem {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Kategori menüsü: bulunulan sayfa yumuşak arka planla işaretlenir. */
export function HeaderNav({ items }: { items: HeaderNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Kategoriler"
      className="flex items-center gap-0.5 overflow-x-auto text-[13px] font-bold whitespace-nowrap [scrollbar-width:none]"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-full px-2.5 py-2 transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-primary hover:text-brand-dark"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
