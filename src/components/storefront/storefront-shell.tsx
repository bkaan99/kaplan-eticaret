"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isFeatureEnabled } from "@/config/features";
import { initWishlist } from "@/components/wishlist/wishlist-store";
import { CartCount } from "./cart-count";
import { BagIcon, UserIcon } from "./icons";
import { STOREFRONT_SHELL_REFRESH } from "./shell-events";

type ShellUser = {
  name: string;
  email: string;
  type: "CUSTOMER" | "STAFF";
};

type ShellState = {
  cartCount: number;
  user: ShellUser | null;
};

/**
 * Sepet + hesap — SSR’da kişiselleştirme yok.
 * Anonim HTML edge cache’lenebilir; oturum/sepet istemcide yüklenir.
 */
export function StorefrontShellActions({
  accountClassName = "",
}: {
  accountClassName?: string;
}) {
  const [state, setState] = useState<ShellState>({
    cartCount: 0,
    user: null,
  });

  // Header sayfa geçişlerinde yeniden oluşmaz; giriş/çıkış sonrası yönlendirmede
  // oturum durumunu yenilemek için rota değişimini izleriz.
  const pathname = usePathname();

  const load = useCallback(() => {
    void fetch("/api/storefront/shell", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("shell");
        return res.json() as Promise<{
          cartCount: number;
          user: ShellUser | null;
          wishlistIds: string[];
        }>;
      })
      .then((data) => {
        setState({
          cartCount: data.cartCount,
          user: data.user,
        });
        if (isFeatureEnabled("wishlist")) {
          void initWishlist(Boolean(data.user), data.wishlistIds ?? []);
        }
      })
      .catch(() => {
        if (isFeatureEnabled("wishlist")) {
          void initWishlist(false, []);
        }
      });
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener(STOREFRONT_SHELL_REFRESH, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener(STOREFRONT_SHELL_REFRESH, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [load, pathname]);

  const user = state.user;
  const label = user?.name || user?.email || "";

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        {user?.type === "STAFF" ? (
          <Link
            href="/admin"
            aria-label="Admin Paneli"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-2.5 text-xs font-bold text-amber-400 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-md sm:px-3"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="hidden sm:inline">Admin</span>
          </Link>
        ) : null}

        <Link
          href={user ? "/hesabim" : "/giris"}
          className={accountClassName}
          title={user ? label : "Giriş Yap"}
        >
          <UserIcon />
          <span className="sr-only">{user ? label : "Giriş Yap"}</span>
        </Link>
      </div>

      <Link
        href="/sepet"
        className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark md:bg-transparent md:px-2 md:font-semibold md:text-primary md:hover:bg-primary/5"
        aria-label={`Sepet, ${state.cartCount} ürün`}
      >
        <BagIcon />
        <span className="max-[359px]:sr-only">Sepetim</span>
        <CartCount count={state.cartCount} />
      </Link>
    </>
  );
}
