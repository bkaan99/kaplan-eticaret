import Decimal from "decimal.js";
import {
  and,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  not,
  or,
  type SQL,
} from "drizzle-orm";
import {
  chunk,
  containsText,
  countWhere,
  order,
  user as userTable,
  type Db,
} from "@/db";
import type {
  CustomerDetail,
  CustomerRow,
  CustomerSegment,
} from "./customer-query";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export interface CustomerSearchResult {
  items: CustomerRow[];
  total: number;
}

export interface CustomerQueryRepository {
  search(query: {
    search?: string;
    segment?: CustomerSegment;
    page: number;
    pageSize: number;
  }): Promise<CustomerSearchResult>;
  /** Arama koşuluna uyan müşterilerin segment bazında sayısı */
  segmentCounts(search?: string): Promise<Record<CustomerSegment, number>>;
  findById(id: string): Promise<CustomerDetail | null>;
}

export class D1CustomerQueryRepository implements CustomerQueryRepository {
  constructor(private readonly db: () => Db) {}

  /** Müşteri + arama koşulu (anonimleştirilmiş hesaplar hariç). */
  private baseWhere(search?: string): SQL | undefined {
    const term = search?.trim();
    return and(
      eq(userTable.type, "CUSTOMER"),
      isNull(userTable.anonymizedAt),
      term
        ? or(
            containsText(userTable.email, term),
            containsText(userTable.firstName, term),
            containsText(userTable.lastName, term),
          )
        : undefined,
    );
  }

  private segmentWhere(db: Db, segment: CustomerSegment): SQL | undefined {
    const hasPaidOrder = exists(
      db
        .select({ one: order.id })
        .from(order)
        .where(
          and(
            eq(order.userId, userTable.id),
            inArray(order.status, [...PAID_STATUSES]),
          ),
        ),
    );
    switch (segment) {
      case "buyers":
        return hasPaidOrder;
      case "no-orders":
        return not(hasPaidOrder);
      case "unverified":
        return isNull(userTable.emailVerifiedAt);
      default:
        return undefined;
    }
  }

  async segmentCounts(
    search?: string,
  ): Promise<Record<CustomerSegment, number>> {
    const db = this.db();
    const base = this.baseWhere(search);
    const [all, buyers, noOrders, unverified] = await Promise.all(
      (["all", "buyers", "no-orders", "unverified"] as const).map((segment) =>
        countWhere(db, userTable, and(base, this.segmentWhere(db, segment))),
      ),
    );
    return {
      all: all!,
      buyers: buyers!,
      "no-orders": noOrders!,
      unverified: unverified!,
    };
  }

  async search(query: {
    search?: string;
    segment?: CustomerSegment;
    page: number;
    pageSize: number;
  }): Promise<CustomerSearchResult> {
    const db = this.db();
    const where = and(
      this.baseWhere(query.search),
      this.segmentWhere(db, query.segment ?? "all"),
    );

    const [total, users] = await Promise.all([
      countWhere(db, userTable, where),
      db
        .select()
        .from(userTable)
        .where(where)
        .orderBy(desc(userTable.createdAt))
        .offset((query.page - 1) * query.pageSize)
        .limit(query.pageSize),
    ]);

    const stats = await this.statsFor(users.map((user) => user.id));

    return {
      total,
      items: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerifiedAt !== null,
        isActive: user.isActive,
        orderCount: stats.get(user.id)?.count ?? 0,
        totalSpent: stats.get(user.id)?.total ?? "0.00",
        lastOrderAt: stats.get(user.id)?.lastAt ?? null,
        createdAt: user.createdAt,
      })),
    };
  }

  async findById(id: string): Promise<CustomerDetail | null> {
    const user = await this.db().query.user.findFirst({
      where: and(eq(userTable.id, id), eq(userTable.type, "CUSTOMER")),
      with: {
        customer: { with: { group: { columns: { name: true } } } },
        orders: { orderBy: desc(order.createdAt), limit: 50 },
        addresses: true,
      },
    });
    if (!user) return null;

    const stats = await this.statsFor([user.id]);

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerifiedAt !== null,
      isActive: user.isActive,
      orderCount: stats.get(user.id)?.count ?? 0,
      totalSpent: stats.get(user.id)?.total ?? "0.00",
      lastOrderAt: stats.get(user.id)?.lastAt ?? null,
      createdAt: user.createdAt,
      b2bStatus: user.customer?.b2bStatus ?? "NONE",
      companyName: user.customer?.companyName ?? null,
      groupName: user.customer?.group?.name ?? null,
      addresses: [...user.addresses]
        .sort(
          (a, b) =>
            Number(b.isDefaultShipping) - Number(a.isDefaultShipping) ||
            Number(b.isDefaultBilling) - Number(a.isDefaultBilling),
        )
        .map((item) => ({
          id: item.id,
          title: item.title,
          name: `${item.firstName} ${item.lastName}`.trim(),
          phone: item.phone,
          line: [item.addressLine, item.neighborhood]
            .filter(Boolean)
            .join(", "),
          district: item.district,
          city: item.city,
          isDefaultShipping: item.isDefaultShipping,
          isDefaultBilling: item.isDefaultBilling,
          companyName: item.companyName,
        })),
      orders: user.orders.map((row) => ({
        orderNumber: row.orderNumber,
        status: row.status,
        grandTotal: row.grandTotal.toFixed(2),
        createdAt: row.createdAt,
      })),
    };
  }

  private async statsFor(
    userIds: string[],
  ): Promise<
    Map<string, { count: number; total: string; lastAt: Date | null }>
  > {
    const db = this.db();
    const totals = new Map<
      string,
      { count: number; total: Decimal; lastAt: Date | null }
    >();

    // Toplama JS'te Decimal ile yapılır (SQL SUM kayan nokta hatası üretebilir);
    // kimlik listesi D1 parametre sınırı için parçalanır.
    for (const ids of chunk(userIds)) {
      const rows = await db
        .select({
          userId: order.userId,
          grandTotal: order.grandTotal,
          createdAt: order.createdAt,
        })
        .from(order)
        .where(
          and(
            inArray(order.userId, ids),
            inArray(order.status, [...PAID_STATUSES]),
          ),
        );
      for (const row of rows) {
        if (!row.userId) continue;
        const current = totals.get(row.userId) ?? {
          count: 0,
          total: new Decimal(0),
          lastAt: null,
        };
        totals.set(row.userId, {
          count: current.count + 1,
          total: current.total.plus(row.grandTotal),
          lastAt:
            !current.lastAt || row.createdAt > current.lastAt
              ? row.createdAt
              : current.lastAt,
        });
      }
    }

    return new Map(
      [...totals].map(([id, value]) => [
        id,
        {
          count: value.count,
          total: value.total.toFixed(2),
          lastAt: value.lastAt,
        },
      ]),
    );
  }
}
