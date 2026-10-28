import { getDb } from "@/shared/db";
import { priceResolver } from "../catalog/container";
import { customPickleService } from "../custom-pickle/container";
import { PrismaCartRepository } from "./cart.repository";
import { CartService } from "./cart.service";

export const cartService = new CartService(
  new PrismaCartRepository(getDb),
  priceResolver,
  customPickleService,
);
