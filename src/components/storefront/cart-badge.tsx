import Link from "next/link";
import { getCurrentCart } from "@/modules/cart/cart.session";
import { CartCount } from "./cart-count";
import { BagIcon } from "./icons";

export async function CartBadge() {
  const cart = await getCurrentCart();

  return (
    <Link
      href="/sepet"
      className="relative ml-1 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-dark"
      aria-label={`Sepet, ${cart.itemCount} ürün`}
    >
      <BagIcon />
      <span className="hidden sm:inline">Sepet</span>
      <CartCount count={cart.itemCount} />
    </Link>
  );
}
