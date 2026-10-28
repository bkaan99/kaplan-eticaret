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

  return (
    <div className="flex items-center gap-2">
      {isStaff ? (
        <Link
          href="/admin"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900 px-3.5 text-xs font-bold text-amber-400 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-md"
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
          <span>Admin Paneli</span>
        </Link>
      ) : null}

      <Link
        href="/hesabim"
        className={className}
        title={user.name || user.email}
      >
        <UserIcon />
        <span className="sr-only max-w-28 truncate lg:not-sr-only">
          {user.name || user.email}
        </span>
      </Link>
    </div>
  );
}
