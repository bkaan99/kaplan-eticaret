import Link from "next/link";
import { getCurrentCart } from "@/modules/cart/cart.session";
import { CartCount } from "./cart-count";
import { BagIcon } from "./icons";

export async function CartBadge() {
  const cart = await getCurrentCart();

  return (
    <Link
      href="/sepet"
      className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark md:bg-transparent md:px-2 md:font-semibold md:text-primary md:hover:bg-primary/5"
      aria-label={`Sepet, ${cart.itemCount} ürün`}
    >
      <BagIcon />
      <span className="max-[359px]:sr-only">Sepetim</span>
      <CartCount count={cart.itemCount} />
    </Link>
  );
}
