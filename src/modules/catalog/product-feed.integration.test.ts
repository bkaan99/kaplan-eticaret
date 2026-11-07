import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  productImage,
  productOption,
  productOptionValue,
  variantOptionValue,
  type Db,
} from "@/db";
import { CUSTOM_PICKLE_PRODUCT_SLUG } from "@/modules/custom-pickle/custom-pickle.types";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  insertRow,
  makeCategory,
  makeProduct,
} from "../../../tests/support/factories";
import { D1CatalogRepository } from "./catalog.repository";
import { listFeedProducts } from "./product-feed.repository";

describe("Ürün beslemesi (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;

    const root = await makeCategory(db, { name: "Turşular", slug: `t-${tag}` });
    const child = await makeCategory(db, {
      name: "Klasik",
      slug: `k-${tag}`,
      parentId: root.id,
    });

    const jar = await makeProduct(
      db,
      {
        name: "Salatalık Turşusu",
        slug: `salatalik-${tag}`,
        status: "ACTIVE",
        categoryId: child.id,
        weightGram: 1000,
        ingredients: "Salatalık, su, tuz",
      },
      [
        {
          sku: `S1-${tag}`,
          price: "149.90",
          stockQuantity: 5,
          barcode: "8690504000013",
        },
        { sku: `S3-${tag}`, price: "349.90", stockQuantity: 5, barcode: "123" },
      ],
    );
    const option = await insertRow(db, productOption, {
      productId: jar.id,
      name: "Boyut",
    });
    const [small, large] = await Promise.all(
      ["1 kg", "3 kg"].map((value, position) =>
        insertRow(db, productOptionValue, {
          optionId: option.id,
          value,
          position,
        }),
      ),
    );
    const [v1, v3] = [...jar.variants].sort((a, b) => a.price.cmp(b.price));
    await insertRow(db, variantOptionValue, {
      variantId: v1!.id,
      optionValueId: small!.id,
    });
    await insertRow(db, variantOptionValue, {
      variantId: v3!.id,
      optionValueId: large!.id,
    });
    await insertRow(db, productImage, {
      productId: jar.id,
      url: "/uploads/a.jpg",
      position: 0,
    });
    await insertRow(db, productImage, {
      productId: jar.id,
      url: "/uploads/b.jpg",
      position: 1,
      optionValueId: large!.id,
    });

    await makeProduct(
      db,
      {
        name: "Taslak",
        slug: `taslak-${tag}`,
        status: "DRAFT",
        categoryId: child.id,
      },
      [{ sku: `D-${tag}`, price: "10", stockQuantity: 1 }],
    );
  });

  afterAll(() => t.close());

  it("yayındaki ürünü varyant, kategori yolu, GTIN ve görselleriyle döner", async () => {
    const categories = await new D1CatalogRepository(() => db).listCategories();
    const products = await listFeedProducts(
      db,
      categories,
      (url) => `https://site.test${url}`,
    );
    const jar = products.find((p) => p.slug === `salatalik-${tag}`);

    expect(products.some((p) => p.slug === `taslak-${tag}`)).toBe(false);
    expect(products.some((p) => p.slug === CUSTOM_PICKLE_PRODUCT_SLUG)).toBe(
      false,
    );
    expect(jar).toMatchObject({
      productType: "Turşular > Klasik",
      weightGram: 1000,
      imageUrls: ["https://site.test/uploads/a.jpg"],
    });
    expect(
      jar!.variants.map((v) => [v.optionLabel, v.gtin, v.imageUrl]),
    ).toEqual([
      ["1 kg", "8690504000013", null],
      ["3 kg", null, "https://site.test/uploads/b.jpg"],
    ]);
  });
});
