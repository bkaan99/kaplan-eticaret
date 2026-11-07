import { connection } from "next/server";
import { isFeatureEnabled } from "@/config/features";
import { CACHE_PRIVATE } from "@/config/cache-policy";
import { getCurrentUser } from "@/modules/auth/session";
import { getCurrentCart } from "@/modules/cart/cart.session";
import { wishlistService } from "@/modules/wishlist/container";

export const runtime = "nodejs";

/**
 * Vitrin kabuğu için tek kişiselleştirme uç noktası.
 * HTML edge cache’ten gelsin; sepet/hesap/favori istemcide bu API ile doldurulur.
 */
export async function GET() {
  await connection();

  const [user, cart] = await Promise.all([
    getCurrentUser(),
    getCurrentCart(),
  ]);

  let wishlistIds: string[] = [];
  if (isFeatureEnabled("wishlist") && user) {
    wishlistIds = await wishlistService.list(user.id);
  }

  return Response.json(
    {
      cartCount: cart.itemCount,
      user: user
        ? { name: user.name, email: user.email, type: user.type }
        : null,
      wishlistIds,
    },
    {
      headers: {
        "Cache-Control": CACHE_PRIVATE,
      },
    },
  );
}
