import Link from "next/link";
import { getCurrentCart } from "@/modules/cart/cart.session";
import { CartCount } from "./cart-count";
import { BagIcon } from "./icons";

export async function CartBadge() {
  const cart = await getCurrentCart();

  return (
    <Link
      href="/sepet"
      className="relative ml-1 inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-dark sm:px-4"
      aria-label={`Sepet, ${cart.itemCount} ürün`}
    >
      <BagIcon />
      <span className="hidden sm:inline">Sepet</span>
      <CartCount count={cart.itemCount} />
    </Link>
  );
}
