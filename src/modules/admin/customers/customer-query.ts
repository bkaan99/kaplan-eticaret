import Decimal from "decimal.js";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import {
  chunk,
  containsText,
  countWhere,
  order,
  user as userTable,
  type Db,
} from "@/db";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  isActive: boolean;
  orderCount: number;
  totalSpent: string;
  createdAt: Date;
}

export interface CustomerDetail extends CustomerRow {
  b2bStatus: string;
  companyName: string | null;
  groupName: string | null;
  orders: {
    orderNumber: string;
    status: string;
    grandTotal: string;
    createdAt: Date;
  }[];
}

export interface CustomerPage {
  items: CustomerRow[];
  total: number;
  page: number;
  totalPages: number;
}

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/** Müşteri okuma modeli (yönetim panelinde yalnızca görüntüleme). */
export class CustomerQueryService {
  constructor(private readonly db: () => Db) {}

  async search(query: {
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<CustomerPage> {
    const db = this.db();
    const term = query.search?.trim();
    const where = and(
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
      page: query.page,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      items: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerifiedAt !== null,
        isActive: user.isActive,
        orderCount: stats.get(user.id)?.count ?? 0,
        totalSpent: stats.get(user.id)?.total ?? "0.00",
        createdAt: user.createdAt,
      })),
    };
  }

  async get(id: string): Promise<CustomerDetail | null> {
    const user = await this.db().query.user.findFirst({
      where: and(eq(userTable.id, id), eq(userTable.type, "CUSTOMER")),
      with: {
        customer: { with: { group: { columns: { name: true } } } },
        orders: { orderBy: desc(order.createdAt), limit: 50 },
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
      createdAt: user.createdAt,
      b2bStatus: user.customer?.b2bStatus ?? "NONE",
      companyName: user.customer?.companyName ?? null,
      groupName: user.customer?.group?.name ?? null,
      orders: user.orders.map((order) => ({
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: order.grandTotal.toFixed(2),
        createdAt: order.createdAt,
      })),
    };
  }

  private async statsFor(
    userIds: string[],
  ): Promise<Map<string, { count: number; total: string }>> {
    const db = this.db();
    const totals = new Map<string, { count: number; total: Decimal }>();

    // Toplama JS'te Decimal ile yapılır (SQL SUM kayan nokta hatası üretebilir);
    // kimlik listesi D1 parametre sınırı için parçalanır.
    for (const ids of chunk(userIds)) {
      const rows = await db
        .select({ userId: order.userId, grandTotal: order.grandTotal })
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
        };
        totals.set(row.userId, {
          count: current.count + 1,
          total: current.total.plus(row.grandTotal),
        });
      }
    }

    return new Map(
      [...totals].map(([id, value]) => [
        id,
        { count: value.count, total: value.total.toString() },
      ]),
    );
  }
}
