"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export interface HeaderNavItem {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Kategori menüsü: bulunulan sayfa kayan bir vurguyla işaretlenir. */
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
            className={`relative rounded-full px-2.5 py-2 text-primary transition-colors hover:text-brand-dark`}
          >
            {active ? (
              <motion.span
                layoutId="header-nav-active"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary/10"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            ) : null}
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
