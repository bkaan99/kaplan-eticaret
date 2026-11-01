import { getDb } from "@/shared/db";
import { priceResolver } from "../catalog/container";
import { customPickleService } from "../custom-pickle/container";
import { D1CartRepository } from "./cart.repository";
import { CartService } from "./cart.service";

export const cartService = new CartService(
  new D1CartRepository(getDb),
  priceResolver,
  customPickleService,
);
