"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "./icons";

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
      className="-mx-4 flex gap-1 overflow-x-auto px-4 text-sm font-medium whitespace-nowrap [scrollbar-width:none] xl:mx-0 xl:justify-center xl:px-0"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-full px-4 py-2 transition-colors ${active ? "text-primary" : "text-slate-600 hover:text-slate-900"}`}
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

/** Dar ekranlarda arama, ikona basınca başlığın altında açılır. */
export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Aramayı kapat" : "Ürün ara"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
      >
        <SearchIcon />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.form
            action="/ara"
            role="search"
            className="absolute inset-x-0 top-full border-b border-slate-100 bg-white px-4 py-3 shadow-lg md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <input
              ref={inputRef}
              name="q"
              type="search"
              placeholder="Turşu, şalgam, hediye kutusu ara…"
              aria-label="Ürün ara"
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </motion.form>
        ) : null}
      </AnimatePresence>
    </>
  );
}
