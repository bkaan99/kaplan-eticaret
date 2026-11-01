import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import {
  address,
  cart,
  order,
  user as userTable,
  wishlistItem,
  type Db,
} from "@/db";
import { createTestDb, type TestDb } from "../../../tests/support/test-db";
import {
  d,
  makeCategory,
  makeOrder,
  makeProduct,
  makeUser,
} from "../../../tests/support/factories";
import { D1AddressRepository } from "./address.repository";
import { D1PrivacyRepository } from "./privacy.repository";

describe("KVKK: veri dışa aktarma ve anonimleştirme (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let privacy: D1PrivacyRepository;
  let userId: string;
  let email: string;
  let productId: string;
  let variantId: string;

  const rows = async (
    table: typeof address | typeof wishlistItem | typeof cart | typeof order,
    column: Parameters<typeof eq>[0],
    value: string,
  ) =>
    (
      await db
        .select({ n: count() })
        .from(table as typeof address)
        .where(eq(column, value))
    )[0]!.n;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    privacy = new D1PrivacyRepository(() => db);

    const category = await makeCategory(db, {
      name: "KVKK",
      slug: `kvkk-${tag}`,
    });
    const product = await makeProduct(
      db,
      {
        name: `KVKK Ürünü ${tag}`,
        slug: `kvkk-urunu-${tag}`,
        status: "ACTIVE",
        categoryId: category.id,
      },
      [{ sku: `KVKK-${tag}`, price: "10.00", stockQuantity: 5 }],
    );
    productId = product.id;
    variantId = product.variants[0]!.id;

    email = `kvkk-${tag}@example.com`;
    const user = await makeUser(
      db,
      {
        email,
        passwordHash: "hash",
        firstName: "Ayşe",
        lastName: "Yılmaz",
        phone: "05550000000",
      },
      {
        b2bStatus: "APPROVED",
        companyName: "Gizli Ltd.",
        taxNumber: "1234567890",
        taxOffice: "Kadıköy",
        creditLimit: d("1000.00"),
      },
    );
    userId = user.id;

    await db.insert(address).values({
      userId,
      title: "Ev",
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: "05550000000",
      city: "İstanbul",
      district: "Kadıköy",
      addressLine: "Gizli Sokak No: 1",
    });
    await db.insert(wishlistItem).values({ userId, productId });
    await db.insert(cart).values({ userId });
    await makeOrder(
      db,
      {
        userId,
        guestEmail: email,
        status: "DELIVERED",
        paymentStatus: "PAID",
        subtotal: "10.00",
        grandTotal: "10.00",
        shippingAddress: { firstName: "Ayşe" },
        billingAddress: { firstName: "Ayşe" },
      },
      [
        {
          variantId,
          productName: "KVKK Ürünü",
          sku: `KVKK-${tag}`,
          unitPrice: "10.00",
          taxRate: "20.00",
          quantity: 1,
          lineTotal: "10.00",
        },
      ],
    );
  });

  afterAll(async () => {
    await t.close();
  });

  it("tüm kişisel veriyi dışa aktarır", async () => {
    const data = await privacy.collectExport(userId);

    expect(data?.account).toMatchObject({
      email,
      firstName: "Ayşe",
      phone: "05550000000",
    });
    expect(data?.addresses).toHaveLength(1);
    expect(data?.orders).toHaveLength(1);
    expect(data?.wishlist[0]?.slug).toBe(`kvkk-urunu-${tag}`);
    expect(data?.dealer).toMatchObject({ companyName: "Gizli Ltd." });
  });

  it("teslim edilmiş ödenmiş siparişi açık sipariş saymaz", async () => {
    expect(await privacy.openOrderCount(userId)).toBe(0);
  });

  it("hesabı anonimleştirir: kişisel veriler silinir, sipariş kaydı korunur", async () => {
    await privacy.anonymize(userId);

    const user = (await db.query.user.findFirst({
      where: eq(userTable.id, userId),
      with: { customer: true },
    }))!;
    expect(user.email).toBe(`silinmis-${userId}@anonim.invalid`);
    expect(user).toMatchObject({
      firstName: "Silinmiş",
      phone: null,
      passwordHash: null,
      isActive: false,
    });
    expect(user.anonymizedAt).not.toBeNull();
    expect(user.customer).toMatchObject({
      companyName: null,
      taxNumber: null,
      b2bStatus: "NONE",
    });

    expect(await rows(address, address.userId, userId)).toBe(0);
    expect(await rows(wishlistItem, wishlistItem.userId, userId)).toBe(0);
    expect(await rows(cart, cart.userId, userId)).toBe(0);

    // Yasal saklama: sipariş kayıtları durur.
    expect(await rows(order, order.userId, userId)).toBe(1);
  });

  it("açık siparişi olan kullanıcıyı tespit eder", async () => {
    const other = await makeUser(db, {
      email: `acik-${tag}@example.com`,
      firstName: "A",
      lastName: "B",
    });
    await makeOrder(db, {
      userId: other.id,
      guestEmail: other.email,
      status: "SHIPPED",
      paymentStatus: "PAID",
      subtotal: "10.00",
      grandTotal: "10.00",
      shippingAddress: {},
      billingAddress: {},
    });

    expect(await privacy.openOrderCount(other.id)).toBe(1);
  });

  it("adres defterinde varsayılan bayrağı tek adreste tutar", async () => {
    const user = await makeUser(db, {
      email: `adres-${tag}@example.com`,
      firstName: "A",
      lastName: "B",
    });
    const addresses = new D1AddressRepository(() => db);
    const base = {
      title: "Ev",
      firstName: "A",
      lastName: "B",
      phone: "05550000000",
      city: "İstanbul",
      district: "Kadıköy",
      neighborhood: null,
      addressLine: "Örnek Sokak No: 1",
      postalCode: null,
      invoiceType: "INDIVIDUAL" as const,
      nationalId: null,
      companyName: null,
      taxNumber: null,
      taxOffice: null,
      isDefaultBilling: false,
    };

    await addresses.create(user.id, { ...base, isDefaultShipping: true });
    const second = await addresses.create(user.id, {
      ...base,
      title: "İş",
      isDefaultShipping: true,
    });

    const list = await addresses.list(user.id);
    expect(list.filter((a) => a.isDefaultShipping)).toHaveLength(1);
    expect(list.find((a) => a.isDefaultShipping)?.id).toBe(second);
  });
});
