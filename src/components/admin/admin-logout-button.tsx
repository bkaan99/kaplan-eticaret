"use client";

import { useTransition } from "react";
import { logoutAction } from "@/modules/auth/logout.action";

export function AdminLogoutButton({
  variant = "sidebar",
  className = "",
}: {
  variant?: "sidebar" | "header" | "minimal";
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className={`inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 underline cursor-pointer disabled:opacity-60 ${className}`}
      >
        <span>{isPending ? "Çıkılıyor..." : "Çıkış Yap"}</span>
      </button>
    );
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        title="Yönetici oturumunu kapat"
        className={`inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/70 px-3.5 py-1.5 text-xs font-semibold text-red-700 shadow-2xs transition hover:border-red-300 hover:bg-red-100 hover:text-red-800 disabled:opacity-60 cursor-pointer ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
        <span>{isPending ? "Çıkılıyor..." : "Çıkış Yap"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-60 cursor-pointer ${className}`}
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
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
      <span>{isPending ? "Çıkış Yapılıyor..." : "Çıkış Yap"}</span>
    </button>
  );
}
