import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/session";
import { UserIcon } from "./icons";

export async function AccountLink({ className = "" }: { className?: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/giris" className={className}>
        <UserIcon />
        <span className="sr-only lg:not-sr-only">Giriş Yap</span>
      </Link>
    );
  }

  const isStaff = user.type === "STAFF";
  const label = user.name || user.email;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {isStaff ? (
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

      <Link href="/hesabim" className={className} title={label}>
        <UserIcon />
        <span
          className={`sr-only max-w-24 truncate ${isStaff ? "xl:not-sr-only" : "lg:not-sr-only"}`}
        >
          {label}
        </span>
      </Link>
    </div>
  );
}
