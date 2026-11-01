import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  customerGroup,
  product as productTable,
  tierPrice,
  variantGroupPrice,
  type Db,
} from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  d,
  insertRow,
  makeCategory,
  makeProduct,
  makeUser,
} from "../../../tests/support/factories";
import { D1CatalogRepository } from "../catalog/catalog.repository";
import { CatalogService } from "../catalog/catalog.service";
import { GroupPriceResolver } from "../catalog/pricing";
import { D1PricingRepository } from "../catalog/pricing.repository";
import { D1PriceListRepository } from "../admin/pricing/price-list.repository";
import { D1DealerRepository } from "./dealer.repository";

describe("B2B fiyatlandırma ve bayi (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let resolver: GroupPriceResolver;
  let catalog: CatalogService;
  let groupId: string;
  let variantA: string;
  let variantB: string;
  let productSlug: string;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    resolver = new GroupPriceResolver(new D1PricingRepository(() => db));
    catalog = new CatalogService(new D1CatalogRepository(() => db), resolver);

    const category = await makeCategory(db, {
      name: "B2B",
      slug: `b2b-${tag}`,
    });
    productSlug = `b2b-urun-${tag}`;
    const product = await makeProduct(
      db,
      {
        name: `B2B Ürün ${tag}`,
        slug: productSlug,
        status: "ACTIVE",
        categoryId: category.id,
      },
      [
        { sku: `B2B-A-${tag}`, price: "100.00", stockQuantity: 50 },
        { sku: `B2B-B-${tag}`, price: "200.00", stockQuantity: 50 },
      ],
    );
    const variants = [...product.variants].sort((a, b) =>
      a.sku.localeCompare(b.sku),
    );
    variantA = variants[0]!.id;
    variantB = variants[1]!.id;

    const group = await insertRow(db, customerGroup, {
      name: `Bayi ${tag}`,
      slug: `bayi-${tag}`,
      discountPercent: d("20.00"),
    });
    groupId = group.id;

    await db
      .insert(variantGroupPrice)
      .values({ variantId: variantA, groupId, price: d("70.00") });
    // Genel (herkese) kademe: 10 adetten itibaren 150
    await db.insert(tierPrice).values({
      variantId: variantB,
      groupId: null,
      minQuantity: 10,
      price: d("150.00"),
    });
  });

  afterAll(async () => {
    await t.close();
  });

  const request = (variantId: string, listPrice: string, quantity = 1) => ({
    variantId,
    listPrice,
    quantity,
  });

  it("grup fiyatı, iskonto ve genel kademeyi veritabanından çözer", async () => {
    const withGroup = await resolver.resolveUnitPrices(
      [
        request(variantA, "100"),
        request(variantB, "200"),
        request(variantB, "200", 10),
      ],
      { customerGroupId: groupId },
    );
    // Aynı varyant iki kez gönderildiğinden son istek kazanır; ayrı çözelim:
    expect(withGroup.get(variantA)?.toFixed(2)).toBe("70.00");

    const single = await resolver.resolveUnitPrices(
      [request(variantB, "200")],
      {
        customerGroupId: groupId,
      },
    );
    expect(single.get(variantB)?.toFixed(2)).toBe("160.00"); // 200 × 0.8

    const tiered = await resolver.resolveUnitPrices(
      [request(variantB, "200", 10)],
      {
        customerGroupId: groupId,
      },
    );
    expect(tiered.get(variantB)?.toFixed(2)).toBe("150.00"); // kademe iskontodan düşük
  });

  it("grupsuz müşteri liste fiyatını ve yalnızca genel kademeyi alır", async () => {
    const one = await resolver.resolveUnitPrices([request(variantA, "100")], {
      customerGroupId: null,
    });
    expect(one.get(variantA)?.toFixed(2)).toBe("100.00");

    const bulk = await resolver.resolveUnitPrices(
      [request(variantB, "200", 10)],
      {
        customerGroupId: null,
      },
    );
    expect(bulk.get(variantB)?.toFixed(2)).toBe("150.00");
  });

  it("katalog kartında bayi fiyatını gösterir ve fiyatı gizleyebilir", async () => {
    const product = (await db.query.product.findFirst({
      where: eq(productTable.slug, productSlug),
    }))!;

    const [dealerCard] = await catalog.getCardsInOrder([product.id], {
      customerGroupId: groupId,
    });
    expect(dealerCard).toMatchObject({ price: "70.00", priceVisible: true });

    const [retailCard] = await catalog.getCardsInOrder([product.id], {
      customerGroupId: null,
    });
    expect(retailCard!.price).toBe("100.00");

    const [hiddenCard] = await catalog.getCardsInOrder([product.id], {
      customerGroupId: null,
      pricesVisible: false,
    });
    expect(hiddenCard).toMatchObject({ priceVisible: false, price: "0.00" });
  });

  it("ürün detayında fiyatı gizlendiğinde varyant fiyatları sızmaz", async () => {
    const detail = await catalog.getProductBySlug(productSlug, {
      customerGroupId: groupId,
      pricesVisible: false,
    });
    expect(detail.priceVisible).toBe(false);
    expect(detail.variants.every((v) => v.price === "0.00")).toBe(true);
  });

  it("bayi başvurusu → onay → profil akışı", async () => {
    const dealers = new D1DealerRepository(() => db);
    const user = await makeUser(
      db,
      { email: `bayi-${tag}@example.com`, firstName: "Bayi", lastName: "Aday" },
      true,
    );

    await dealers.apply(user.id, {
      companyName: "Test Ltd.",
      taxNumber: "1234567890",
      taxOffice: "Kadıköy",
    });
    expect((await dealers.findProfile(user.id))?.status).toBe("PENDING");

    const pending = await dealers.listApplications({ status: "PENDING" });
    expect(pending.some((row) => row.userId === user.id)).toBe(true);

    await dealers.approve(user.id, {
      groupId,
      creditLimit: 2500,
      minOrderAmount: 300,
    });
    expect(await dealers.findProfile(user.id)).toMatchObject({
      status: "APPROVED",
      groupId,
      creditLimit: "2500.00",
      minOrderAmount: "300.00",
    });

    await dealers.reject(user.id, "Bayilik sonlandırıldı");
    expect(await dealers.findProfile(user.id)).toMatchObject({
      status: "REJECTED",
      groupId: null,
    });
  });

  it("fiyat listesi: grup fiyatı ve kademeleri yazar, arama sonucunda gösterir", async () => {
    const lists = new D1PriceListRepository(() => db);

    await lists.setGroupPrice(groupId, variantB, 175);
    await lists.replaceTiers(variantB, groupId, [
      { minQuantity: 5, price: 160 },
      { minQuantity: 20, price: 140 },
    ]);

    const rows = await lists.searchVariants(groupId, `B2B-B-${tag}`, 10);
    const row = rows.find((r) => r.variantId === variantB)!;

    expect(row.groupPrice).toBe("175.00");
    expect(row.groupTiers.map((t) => t.minQuantity)).toEqual([5, 20]);
    expect(row.generalTiers.map((t) => t.minQuantity)).toEqual([10]);

    // Grup fiyatı kaldırıldığında iskontoya döner.
    await lists.setGroupPrice(groupId, variantB, null);
    const after = await lists.searchVariants(groupId, `B2B-B-${tag}`, 10);
    expect(after.find((r) => r.variantId === variantB)!.groupPrice).toBeNull();
  });
});
