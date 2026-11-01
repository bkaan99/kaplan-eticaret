import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import {
  category,
  productAttributeValue,
  customer,
  order,
  orderItem,
  payment,
  product,
  productVariant,
  user,
  newId,
  runBatch,
  type Db,
} from "../../src/db";

/** Ondalık değer kısayolu (fixture'larda `"10.00"` yazılır). */
export const d = (value: Decimal.Value) => new Decimal(value);

/** Tek satır ekler ve eklenen satırı döndürür (id vb. varsayılanlar dolu). */
export async function insertRow<T extends SQLiteTable>(
  db: Db,
  table: T,
  values: T["$inferInsert"],
): Promise<T["$inferSelect"]> {
  const [row] = await db.insert(table).values(values).returning();
  return row as T["$inferSelect"];
}

export async function makeCategory(
  db: Db,
  data: Omit<typeof category.$inferInsert, "id"> & { id?: string },
) {
  const [row] = await db.insert(category).values(data).returning();
  return row!;
}

type VariantInput = Omit<
  typeof productVariant.$inferInsert,
  "productId" | "id" | "price"
> & {
  price: Decimal.Value;
  id?: string;
};

export async function makeProduct(
  db: Db,
  data: Omit<typeof product.$inferInsert, "id"> & { id?: string },
  variants: VariantInput[] = [],
  extras: { attributeValueIds?: string[] } = {},
) {
  const id = data.id ?? newId();
  const rows = [
    db.insert(product).values({ ...data, id }),
    ...(extras.attributeValueIds ?? []).map((attributeValueId) =>
      db
        .insert(productAttributeValue)
        .values({ productId: id, attributeValueId }),
    ),
    ...variants.map((v) =>
      db.insert(productVariant).values({
        ...v,
        price: d(v.price),
        compareAtPrice: v.compareAtPrice
          ? d(v.compareAtPrice)
          : v.compareAtPrice,
        productId: id,
      }),
    ),
  ];
  await runBatch(db, rows);
  const created = await db.query.product.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: { variants: true },
  });
  return created!;
}

export async function makeUser(
  db: Db,
  data: Omit<typeof user.$inferInsert, "id"> & { id?: string },
  customerData?: Omit<typeof customer.$inferInsert, "userId" | "id"> | true,
) {
  const id = data.id ?? newId();
  const ops = [db.insert(user).values({ ...data, id })];
  if (customerData)
    ops.push(
      db.insert(customer).values({
        ...(customerData === true ? {} : customerData),
        userId: id,
      }) as never,
    );
  await runBatch(db, ops);
  const [row] = await db.select().from(user).where(eq(user.id, id));
  return row!;
}

export function orderNumber(): string {
  return `K${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

type ItemInput = Omit<
  typeof orderItem.$inferInsert,
  "orderId" | "id" | "unitPrice" | "taxRate" | "lineTotal"
> & {
  unitPrice: Decimal.Value;
  taxRate: Decimal.Value;
  lineTotal: Decimal.Value;
};
type PaymentInput = Omit<
  typeof payment.$inferInsert,
  "orderId" | "id" | "amount"
> & { amount: Decimal.Value };

export async function makeOrder(
  db: Db,
  data: Omit<
    typeof order.$inferInsert,
    "id" | "subtotal" | "grandTotal" | "orderNumber" | "lookupToken"
  > & {
    subtotal: Decimal.Value;
    grandTotal: Decimal.Value;
    orderNumber?: string;
    lookupToken?: string;
    id?: string;
  },
  items: ItemInput[] = [],
  payments: PaymentInput[] = [],
) {
  const id = data.id ?? newId();
  const ops = [
    db.insert(order).values({
      ...data,
      id,
      orderNumber: data.orderNumber ?? orderNumber(),
      lookupToken: data.lookupToken ?? randomUUID(),
      subtotal: d(data.subtotal),
      grandTotal: d(data.grandTotal),
    }),
    ...items.map((i) =>
      db.insert(orderItem).values({
        ...i,
        orderId: id,
        unitPrice: d(i.unitPrice),
        taxRate: d(i.taxRate),
        lineTotal: d(i.lineTotal),
      }),
    ),
    ...payments.map((p) =>
      db.insert(payment).values({ ...p, orderId: id, amount: d(p.amount) }),
    ),
  ];
  await runBatch(db, ops as never);
  return id;
}
