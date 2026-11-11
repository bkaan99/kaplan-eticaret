"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

const ShellContext = createContext<ShellState | null>(null);

function useStorefrontShell(): ShellState {
  const state = useContext(ShellContext);
  if (!state) {
    throw new Error("StorefrontShellProvider gerekli");
  }
  return state;
}

/** Header’da sepet/hesap/admin aynı shell verisini paylaşır. */
export function StorefrontShellProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShellState>({
    cartCount: 0,
    user: null,
  });
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

  const value = useMemo(() => state, [state]);
  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

function AdminShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/**
 * Sepet + hesap — SSR’da kişiselleştirme yok.
 * Anonim HTML edge cache’lenebilir; oturum/sepet istemcide yüklenir.
 */
export function StorefrontShellActions({
  accountClassName = "",
}: {
  accountClassName?: string;
}) {
  const state = useStorefrontShell();
  const user = state.user;
  const label = user?.name || user?.email || "";

  return (
    <>
      {/* Masaüstü üst bar; mobilde hamburger menüdeki Admin linki kullanılır. */}
      {user?.type === "STAFF" ? (
        <Link
          href="/admin"
          aria-label="Admin Paneli"
          title="Admin Paneli"
          className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-3 text-xs font-bold text-amber-400 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-md sm:inline-flex"
        >
          <AdminShieldIcon />
          <span>Admin</span>
        </Link>
      ) : null}

      <Link
        href={user ? "/hesabim" : "/giris"}
        className={`max-sm:hidden ${accountClassName}`}
        title={user ? label : "Giriş Yap"}
      >
        <UserIcon />
        <span className="sr-only">{user ? label : "Giriş Yap"}</span>
      </Link>

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

/** Mobil çekmecede staff için Admin paneli girişi. */
export function MobileNavAdminLink() {
  const { user } = useStorefrontShell();
  if (user?.type !== "STAFF") return null;

  return (
    <Link
      href="/admin"
      className="flex items-center gap-3 rounded-xl bg-slate-900 px-3.5 py-3 text-sm font-bold text-amber-400 transition-colors hover:bg-primary hover:text-white"
    >
      <AdminShieldIcon size={18} />
      <span>Admin Paneli</span>
    </Link>
  );
}
