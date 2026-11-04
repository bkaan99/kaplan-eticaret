import Decimal from "decimal.js";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  sql,
} from "drizzle-orm";
import {
  chunk,
  countWhere,
  customer,
  order,
  orderItem,
  product,
  productVariant,
  returnRequest,
  user,
  type Db,
} from "@/db";
import type {
  CustomerMetrics,
  IngredientUsageRow,
  LowStockItem,
  PeriodTotals,
  ReportingRepository,
  RevenueRow,
  TopProduct,
} from "./reporting.service";

/** Gelire dahil sayılan sipariş durumları (iptal ve iade hariç). */
const REVENUE_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export class D1ReportingRepository implements ReportingRepository {
  constructor(private readonly db: () => Db) {}

  async periodTotals(from: Date, to: Date): Promise<PeriodTotals> {
    const rows = await this.db()
      .select({ grandTotal: order.grandTotal })
      .from(order)
      .where(
        and(
          inArray(order.status, [...REVENUE_STATUSES]),
          gte(order.createdAt, from),
          lt(order.createdAt, to),
        ),
      );

    // Toplama JS'te Decimal ile yapılır: SQL SUM kayan nokta hatası üretebilir.
    return {
      revenue: rows.reduce(
        (total, row) => total.plus(row.grandTotal),
        new Decimal(0),
      ),
      orderCount: rows.length,
    };
  }

  async revenueRows(from: Date, to: Date): Promise<RevenueRow[]> {
    return this.db()
      .select({ createdAt: order.createdAt, grandTotal: order.grandTotal })
      .from(order)
      .where(
        and(
          inArray(order.status, [...REVENUE_STATUSES]),
          gte(order.createdAt, from),
          lt(order.createdAt, to),
        ),
      );
  }

  async ingredientUsage(from: Date, to: Date): Promise<IngredientUsageRow[]> {
    return this.db()
      .select({
        quantity: orderItem.quantity,
        customization: orderItem.customization,
      })
      .from(orderItem)
      .innerJoin(order, eq(order.id, orderItem.orderId))
      .where(
        and(
          isNotNull(orderItem.customization),
          inArray(order.status, [...REVENUE_STATUSES]),
          gte(order.createdAt, from),
          lt(order.createdAt, to),
        ),
      );
  }

  async topProducts(
    from: Date,
    to: Date,
    limit: number,
  ): Promise<TopProduct[]> {
    const quantity = sql<number>`sum(${orderItem.quantity})`;
    const grouped = await this.db()
      .select({
        productName: orderItem.productName,
        quantity,
        revenue: sql<number>`sum(${orderItem.lineTotal})`,
      })
      .from(orderItem)
      .innerJoin(order, eq(order.id, orderItem.orderId))
      .where(
        and(
          inArray(order.status, [...REVENUE_STATUSES]),
          gte(order.createdAt, from),
          lt(order.createdAt, to),
        ),
      )
      .groupBy(orderItem.productName)
      .orderBy(desc(quantity))
      .limit(limit);

    return grouped.map((row) => ({
      name: row.productName,
      quantity: Number(row.quantity ?? 0),
      revenue: new Decimal(row.revenue ?? 0).toFixed(2),
    }));
  }

  countOrdersToProcess(): Promise<number> {
    return countWhere(
      this.db(),
      order,
      inArray(order.status, ["PAID", "PROCESSING"]),
    );
  }

  countOpenReturnRequests(): Promise<number> {
    return countWhere(
      this.db(),
      returnRequest,
      eq(returnRequest.status, "REQUESTED"),
    );
  }

  countPendingDealers(): Promise<number> {
    return countWhere(this.db(), customer, eq(customer.b2bStatus, "PENDING"));
  }

  async lowStock(threshold: number, limit: number): Promise<LowStockItem[]> {
    const rows = await this.db()
      .select({
        productName: product.name,
        sku: productVariant.sku,
        stockQuantity: productVariant.stockQuantity,
        reservedQuantity: productVariant.reservedQuantity,
      })
      .from(productVariant)
      .innerJoin(product, eq(product.id, productVariant.productId))
      .where(
        and(
          eq(productVariant.isActive, true),
          eq(product.status, "ACTIVE"),
          eq(product.trackInventory, true),
        ),
      );

    return rows
      .map((row) => ({
        productName: row.productName,
        sku: row.sku,
        available: Math.max(0, row.stockQuantity - row.reservedQuantity),
      }))
      .filter((row) => row.available <= threshold)
      .sort((a, b) => a.available - b.available)
      .slice(0, limit);
  }

  async customerMetrics(from: Date, to: Date): Promise<CustomerMetrics> {
    const db = this.db();
    const [newCustomers, buyerRows] = await Promise.all([
      countWhere(
        db,
        user,
        and(
          eq(user.type, "CUSTOMER"),
          isNull(user.anonymizedAt),
          gte(user.createdAt, from),
          lt(user.createdAt, to),
        ),
      ),
      db
        .selectDistinct({ userId: order.userId })
        .from(order)
        .where(
          and(
            isNotNull(order.userId),
            inArray(order.status, [...REVENUE_STATUSES]),
            gte(order.createdAt, from),
            lt(order.createdAt, to),
          ),
        ),
    ]);

    const buyerIds = buyerRows
      .map((row) => row.userId)
      .filter((id): id is string => id !== null);

    // Dönemden önce de gelir sayılan siparişi olanlar "tekrar eden" alıcıdır.
    let returning = 0;
    for (const ids of chunk(buyerIds)) {
      const rows = await db
        .selectDistinct({ userId: order.userId })
        .from(order)
        .where(
          and(
            inArray(order.userId, ids),
            inArray(order.status, [...REVENUE_STATUSES]),
            lt(order.createdAt, from),
          ),
        );
      returning += rows.length;
    }

    return {
      newCustomers,
      buyers: buyerIds.length,
      returningBuyers: returning,
    };
  }
}
