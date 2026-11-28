import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb, type TestDb } from "../../../../tests/support/test-db";
import { makeCategory } from "../../../../tests/support/factories";
import { D1CatalogRepository } from "../../catalog/catalog.repository";
import { D1ProductAdminRepository } from "./product-admin.repository";
import { productInputSchema, type ProductInput } from "./product.schema";

describe("D1ProductAdminRepository", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let repo: D1ProductAdminRepository;
  let categoryId: string;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1ProductAdminRepository(() => db);
    const category = await makeCategory(db, {
      name: "Admin Test",
      slug: `admin-test-${tag}`,
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await t.close();
  });

  let counter = 0;
  /** SKU'lar global benzersiz olduğundan her ürün için ayrı önek üretilir. */
  const nextPrefix = () => `A-${tag}-${++counter}`;

  const build = (
    overrides: Record<string, unknown> = {},
    prefix = nextPrefix(),
  ): ProductInput =>
    productInputSchema.parse({
      name: `Admin Ürünü ${tag}`,
      status: "ACTIVE",
      categoryId,
      taxRate: 20,
      options: [
        { name: "Renk", values: ["Siyah", "Beyaz"] },
        { name: "Beden", values: ["S", "M"] },
      ],
      variants: [
        {
          sku: `${prefix}-SS`,
          price: "100",
          stockQuantity: 5,
          optionValues: { Renk: "Siyah", Beden: "S" },
        },
        {
          sku: `${prefix}-BM`,
          price: "110",
          stockQuantity: 3,
          optionValues: { Renk: "Beyaz", Beden: "M" },
        },
      ],
      images: [
        {
          url: "/img/siyah.jpg",
          forOption: { option: "Renk", value: "Siyah" },
        },
        { url: "/img/genel.jpg" },
      ],
      ...overrides,
    });

  it("seçenekler, varyantlar ve görselleriyle ürün oluşturur", async () => {
    const id = await repo.create(build(), `admin-urunu-${tag}`);
    const product = await repo.findForEdit(id);

    expect(product?.options).toEqual([
      { name: "Renk", values: ["Siyah", "Beyaz"] },
      { name: "Beden", values: ["S", "M"] },
    ]);
    expect(product?.variants).toHaveLength(2);
    expect(product?.variants[0]!.optionValues).toEqual({
      Renk: "Siyah",
      Beden: "S",
    });
    expect(product?.images[0]!.forOption).toEqual({
      option: "Renk",
      value: "Siyah",
    });
  });

  it("güncellemede mevcut varyantı korur, yenisini ekler, listede olmayanı pasifleştirir", async () => {
    const prefix = nextPrefix();
    const id = await repo.create(build({}, prefix), `admin-guncelle-${tag}`);
    const created = await repo.findForEdit(id);
    const first = created!.variants[0]!;

    const updated = build(
      {
        options: [
          { name: "Renk", values: ["Siyah", "Beyaz", "Kırmızı"] },
          { name: "Beden", values: ["S", "M"] },
        ],
        variants: [
          {
            id: first.id,
            sku: first.sku,
            price: "150",
            stockQuantity: 9,
            optionValues: first.optionValues,
          },
          {
            sku: `${prefix}-KS`,
            price: "120",
            stockQuantity: 2,
            optionValues: { Renk: "Kırmızı", Beden: "S" },
          },
        ],
        images: [],
      },
      prefix,
    );
    await repo.update(id, updated, `admin-guncelle-${tag}`);

    const product = await repo.findForEdit(id);
    const bySku = new Map(product!.variants.map((v) => [v.sku, v]));

    expect(bySku.get(first.sku)).toMatchObject({
      price: "150.00",
      stockQuantity: 9,
      isActive: true,
    });
    expect(bySku.get(`${prefix}-KS`)).toMatchObject({
      stockQuantity: 2,
      isActive: true,
    });
    // Listeden çıkarılan varyant silinmez, pasifleşir.
    expect(bySku.get(`${prefix}-BM`)).toMatchObject({ isActive: false });
    expect(product!.options[0]!.values).toContain("Kırmızı");
    expect(product!.images).toHaveLength(0);
  });

  it("slug çakışmasını ve hariç tutulan kimliği doğru bildirir", async () => {
    const id = await repo.create(build(), `slug-test-${tag}`);
    expect(await repo.slugTaken(`slug-test-${tag}`)).toBe(true);
    expect(await repo.slugTaken(`slug-test-${tag}`, id)).toBe(false);
  });

  it("liste aramasıyla SKU üzerinden ürün bulur", async () => {
    const prefix = nextPrefix();
    await repo.create(build({}, prefix), `liste-${tag}`);
    const result = await repo.list({
      search: `${prefix}-SS`,
      page: 1,
      pageSize: 10,
    });
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0]!.variantCount).toBe(2);
  });

  describe("boyut varyantları (3 kg / 5 kg ayrı fiyat)", () => {
    const sizes = (prefix: string, overrides: Record<string, unknown> = {}) =>
      build(
        {
          options: [{ name: "Boyut", values: ["3 kg", "5 kg"] }],
          variants: [
            {
              sku: `${prefix}-3KG`,
              price: "249,90",
              compareAtPrice: "299.90",
              stockQuantity: 10,
              optionValues: { Boyut: "3 kg" },
            },
            {
              sku: `${prefix}-5KG`,
              price: "379.90",
              stockQuantity: 4,
              optionValues: { Boyut: "5 kg" },
            },
          ],
          images: [],
          ...overrides,
        },
        prefix,
      );

    it("her boyutun fiyatı, eski fiyatı ve stoğu ayrı saklanır; vitrin ayrı gösterir", async () => {
      const prefix = nextPrefix();
      const slug = `boyut-${tag}-1`;
      const id = await repo.create(sizes(prefix), slug);

      const edit = await repo.findForEdit(id);
      const bySku = new Map(edit!.variants.map((v) => [v.sku, v]));
      expect(bySku.get(`${prefix}-3KG`)).toMatchObject({
        price: "249.90",
        compareAtPrice: "299.90",
        stockQuantity: 10,
      });
      expect(bySku.get(`${prefix}-5KG`)).toMatchObject({
        price: "379.90",
        compareAtPrice: null,
        stockQuantity: 4,
      });

      const detail = await new D1CatalogRepository(() => db).findDetailBySlug(
        slug,
      );
      expect(detail!.options).toHaveLength(1);
      expect(detail!.options[0]!.values.map((v) => v.value)).toEqual([
        "3 kg",
        "5 kg",
      ]);
      expect(detail!.variants.map((v) => v.price.toFixed(2))).toEqual([
        "249.90",
        "379.90",
      ]);
    });

    it("kayıtlı varyantın değeri değişince vitrin yeni adı gösterir, eski ad kalmaz", async () => {
      const prefix = nextPrefix();
      const slug = `boyut-${tag}-2`;
      const id = await repo.create(sizes(prefix), slug);
      const created = await repo.findForEdit(id);
      const three = created!.variants.find((v) => v.sku === `${prefix}-3KG`)!;
      const five = created!.variants.find((v) => v.sku === `${prefix}-5KG`)!;

      await repo.update(
        id,
        sizes(prefix, {
          options: [{ name: "Boyut", values: ["3 kg bidon", "5 kg"] }],
          variants: [
            {
              id: three.id,
              sku: three.sku,
              price: "249.90",
              stockQuantity: 10,
              optionValues: { Boyut: "3 kg bidon" },
            },
            {
              id: five.id,
              sku: five.sku,
              price: "399.90",
              stockQuantity: 4,
              optionValues: { Boyut: "5 kg" },
            },
          ],
        }),
        slug,
      );

      const detail = await new D1CatalogRepository(() => db).findDetailBySlug(
        slug,
      );
      expect(detail!.options[0]!.values.map((v) => v.value)).toEqual([
        "3 kg bidon",
        "5 kg",
      ]);
      const label = new Map(
        detail!.options[0]!.values.map((v) => [v.id, v.value]),
      );
      const labelsByPrice = new Map(
        detail!.variants.map((v) => [
          v.price.toFixed(2),
          v.optionValueIds.map((id) => label.get(id)),
        ]),
      );
      expect(labelsByPrice.get("249.90")).toEqual(["3 kg bidon"]);
      expect(labelsByPrice.get("399.90")).toEqual(["5 kg"]);

      // Düzenleyici de eski adı hayalet olarak geri getirmez.
      const edit = await repo.findForEdit(id);
      expect(edit!.options).toEqual([
        { name: "Boyut", values: ["3 kg bidon", "5 kg"] },
      ]);
    });

    it("kaldırılan varyantın değeri vitrinde fiyatsız düğme olarak kalmaz", async () => {
      const prefix = nextPrefix();
      const slug = `boyut-${tag}-3`;
      const id = await repo.create(sizes(prefix), slug);
      const created = await repo.findForEdit(id);
      const three = created!.variants.find((v) => v.sku === `${prefix}-3KG`)!;

      await repo.update(
        id,
        sizes(prefix, {
          options: [{ name: "Boyut", values: ["3 kg"] }],
          variants: [
            {
              id: three.id,
              sku: three.sku,
              price: "249.90",
              stockQuantity: 10,
              optionValues: { Boyut: "3 kg" },
            },
          ],
        }),
        slug,
      );

      const detail = await new D1CatalogRepository(() => db).findDetailBySlug(
        slug,
      );
      expect(detail!.variants).toHaveLength(1);
      expect(detail!.options[0]!.values.map((v) => v.value)).toEqual(["3 kg"]);
    });
  });
});
