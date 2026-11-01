import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { attribute, attributeValue, brand, type Db } from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  insertRow,
  makeCategory,
  makeProduct,
} from "../../../tests/support/factories";
import { D1CatalogRepository } from "./catalog.repository";
import { CatalogService } from "./catalog.service";
import { parseListQuery } from "./query-params";

describe("Catalog (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  const slug = (name: string) => `${name}-${tag}`;

  let t: TestDb;
  let db: Db;
  let service: CatalogService;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    service = new CatalogService(new D1CatalogRepository(() => db));

    const root = await makeCategory(db, { name: "Kök", slug: slug("kok") });
    const child = await makeCategory(db, {
      name: "Alt",
      slug: slug("alt"),
      parentId: root.id,
    });
    const brandA = await insertRow(db, brand, {
      name: `Marka A ${tag}`,
      slug: slug("marka-a"),
    });
    const brandB = await insertRow(db, brand, {
      name: `Marka B ${tag}`,
      slug: slug("marka-b"),
    });
    const color = await insertRow(db, attribute, {
      name: "Renk",
      slug: slug("renk"),
    });
    const fabric = await insertRow(db, attribute, {
      name: "Kumaş",
      slug: slug("kumas"),
    });
    const red = await insertRow(db, attributeValue, {
      attributeId: color.id,
      value: "Kırmızı",
      slug: "kirmizi",
    });
    const blue = await insertRow(db, attributeValue, {
      attributeId: color.id,
      value: "Mavi",
      slug: "mavi",
    });
    const cotton = await insertRow(db, attributeValue, {
      attributeId: fabric.id,
      value: "Pamuk",
      slug: "pamuk",
    });

    const make = (
      name: string,
      categoryId: string,
      brandId: string,
      price: string,
      values: string[],
      status: "ACTIVE" | "DRAFT" = "ACTIVE",
    ) =>
      makeProduct(
        db,
        {
          name: `${name} ${tag}`,
          slug: slug(name.toLowerCase().replace(/\s/g, "-")),
          status,
          categoryId,
          brandId,
        },
        [{ sku: `${slug(name)}-1`, price, stockQuantity: 3 }],
        { attributeValueIds: values },
      );

    await make("Kırmızı Pamuk", child.id, brandA.id, "100", [
      red.id,
      cotton.id,
    ]);
    await make("Mavi Pamuk", child.id, brandB.id, "200", [blue.id, cotton.id]);
    await make("Mavi Düz", root.id, brandA.id, "300", [blue.id]);
    await make("Taslak Ürün", child.id, brandA.id, "50", [red.id], "DRAFT");
  });

  afterAll(async () => {
    await t.close();
  });

  const list = (params: Record<string, string>, categorySlug?: string) =>
    service.list(parseListQuery(params, { categorySlug, pageSize: 50 }));

  it("kategori seçilince alt kategorilerdeki ürünleri de getirir", async () => {
    const result = await list({}, slug("kok"));
    expect(result.total).toBe(3);
  });

  it("taslak ürünleri listelemez", async () => {
    const result = await list({ q: tag }, slug("kok"));
    expect(result.items.map((i) => i.name)).not.toContain(`Taslak Ürün ${tag}`);
  });

  it("aynı nitelikte VEYA, nitelikler arasında VE uygular", async () => {
    const either = await list(
      { [`f.${slug("renk")}`]: "kirmizi,mavi" },
      slug("kok"),
    );
    expect(either.total).toBe(3);

    const both = await list(
      {
        [`f.${slug("renk")}`]: "mavi",
        [`f.${slug("kumas")}`]: "pamuk",
      },
      slug("kok"),
    );
    expect(both.items.map((i) => i.name)).toEqual([`Mavi Pamuk ${tag}`]);
  });

  it("markaya göre filtreler", async () => {
    const result = await list({ marka: slug("marka-b") }, slug("kok"));
    expect(result.items.map((i) => i.name)).toEqual([`Mavi Pamuk ${tag}`]);
  });

  it("fiyat aralığı ve sıralamayı uygular", async () => {
    const result = await list(
      { "fiyat-min": "150", sirala: "price-desc" },
      slug("kok"),
    );
    expect(result.items.map((i) => i.price)).toEqual(["300.00", "200.00"]);
  });

  it("büyük/küçük harf duyarsız arar", async () => {
    const result = await list({ q: `mavi düz ${tag}`.toUpperCase() });
    expect(result.items.map((i) => i.name)).toEqual([`Mavi Düz ${tag}`]);
  });

  it("facet sayılarını mevcut kapsamdan üretir", async () => {
    const result = await list({}, slug("kok"));
    const color = result.attributeFacets.find((f) => f.slug === slug("renk"));
    const blue = color?.values.find((v) => v.slug === "mavi");
    expect(blue?.count).toBe(2);
  });

  it("ürün detayında varyant ve stok bilgisini döndürür", async () => {
    const detail = await service.getProductBySlug(slug("kırmızı-pamuk"));
    expect(detail.variants).toHaveLength(1);
    expect(detail.variants[0]).toMatchObject({
      price: "100.00",
      inStock: true,
      availableQuantity: 3,
    });
    expect(detail.breadcrumbs.map((b) => b.name)).toEqual(["Kök", "Alt"]);
  });

  it("var olmayan ürün için NotFoundError fırlatır", async () => {
    await expect(service.getProductBySlug(slug("yok"))).rejects.toThrow(
      "Ürün bulunamadı",
    );
  });
});
