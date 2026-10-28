import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/session";
import { UserIcon } from "./icons";

export async function AccountLink({ className = "" }: { className?: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/giris" className={className}>
        <UserIcon />
        <span className="sr-only lg:not-sr-only">Giriş yap</span>
      </Link>
    );
  }

  return (
    <Link
      href={user.type === "STAFF" ? "/admin" : "/hesabim"}
      className={className}
    >
      <UserIcon />
      <span className="sr-only max-w-32 truncate lg:not-sr-only">
        {user.name || user.email}
      </span>
    </Link>
  );
}
