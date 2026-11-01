import { getDb } from "@/shared/db";
import { D1CatalogRepository } from "./catalog.repository";
import { CatalogService } from "./catalog.service";
import { GroupPriceResolver } from "./pricing";
import { D1PricingRepository } from "./pricing.repository";

/** Bayi grubu ve adet kademesi fiyatlarını uygulayan paylaşılan fiyat çözücü. */
export const priceResolver = new GroupPriceResolver(
  new D1PricingRepository(getDb),
);

export const catalogService = new CatalogService(
  new D1CatalogRepository(getDb),
  priceResolver,
);
