import { getDb } from "@/shared/db";
import { D1WishlistRepository } from "./wishlist.repository";
import { WishlistService } from "./wishlist.service";

export const wishlistService = new WishlistService(
  new D1WishlistRepository(getDb),
);
