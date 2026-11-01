import Decimal from "decimal.js";
import { and, desc, eq, exists, notInArray, or, ne, asc } from "drizzle-orm";
import {
  containsText,
  customer,
  customerGroup,
  dec,
  order,
  payment,
  user,
  type Db,
} from "@/db";
import type {
  DealerApplicationInput,
  DealerApplicationRow,
  DealerApprovalInput,
  DealerProfile,
  DealerStatus,
} from "./dealer.types";

export interface GroupOption {
  id: string;
  name: string;
  discountPercent: string | null;
}

export interface DealerRepository {
  findProfile(userId: string): Promise<DealerProfile | null>;
  findContact(userId: string): Promise<{ email: string; name: string } | null>;
  apply(userId: string, input: DealerApplicationInput): Promise<void>;
  listApplications(filter: {
    status?: DealerStatus;
    search?: string;
  }): Promise<DealerApplicationRow[]>;
  groupExists(groupId: string): Promise<boolean>;
  listGroups(): Promise<GroupOption[]>;
  approve(userId: string, input: DealerApprovalInput): Promise<void>;
  reject(userId: string, note: string | null): Promise<void>;
  updateTerms(userId: string, input: DealerApprovalInput): Promise<void>;
  /** Ödenmemiş vadeli sipariş toplamı (kredi kullanımı). */
  outstandingDeferredTotal(userId: string): Promise<Decimal>;
}

export class D1DealerRepository implements DealerRepository {
  constructor(private readonly db: () => Db) {}

  async findProfile(userId: string): Promise<DealerProfile | null> {
    const row = await this.db().query.customer.findFirst({
      where: eq(customer.userId, userId),
      with: { group: { columns: { name: true } } },
    });
    if (!row) return null;

    return {
      userId,
      status: row.b2bStatus,
      groupId: row.groupId,
      groupName: row.group?.name ?? null,
      companyName: row.companyName,
      taxNumber: row.taxNumber,
      taxOffice: row.taxOffice,
      creditLimit: row.creditLimit?.toFixed(2) ?? null,
      minOrderAmount: row.minOrderAmount?.toFixed(2) ?? null,
      note: row.b2bNote,
      approvedAt: row.approvedAt,
    };
  }

  async findContact(userId: string) {
    const row = await this.db().query.user.findFirst({
      where: eq(user.id, userId),
      columns: { email: true, firstName: true, lastName: true },
    });
    return row
      ? { email: row.email, name: `${row.firstName} ${row.lastName}`.trim() }
      : null;
  }

  async apply(userId: string, input: DealerApplicationInput): Promise<void> {
    const fields = {
      b2bStatus: "PENDING" as const,
      companyName: input.companyName,
      taxNumber: input.taxNumber,
      taxOffice: input.taxOffice,
    };
    await this.db()
      .insert(customer)
      .values({ userId, ...fields })
      .onConflictDoUpdate({
        target: customer.userId,
        set: { ...fields, b2bNote: null, updatedAt: new Date() },
      });
  }

  async listApplications(filter: {
    status?: DealerStatus;
    search?: string;
  }): Promise<DealerApplicationRow[]> {
    const search = filter.search?.trim();
    const rows = await this.db()
      .select({ customer, user, groupName: customerGroup.name })
      .from(customer)
      .innerJoin(user, eq(user.id, customer.userId))
      .leftJoin(customerGroup, eq(customerGroup.id, customer.groupId))
      .where(
        and(
          filter.status
            ? eq(customer.b2bStatus, filter.status)
            : ne(customer.b2bStatus, "NONE"),
          search
            ? or(
                containsText(customer.companyName, search),
                containsText(customer.taxNumber, search),
                containsText(user.email, search),
              )
            : undefined,
        ),
      )
      .orderBy(desc(customer.updatedAt))
      .limit(200);

    return rows.map(({ customer: row, user: u, groupName }) => ({
      userId: row.userId,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      phone: u.phone,
      status: row.b2bStatus,
      companyName: row.companyName,
      taxNumber: row.taxNumber,
      taxOffice: row.taxOffice,
      groupId: row.groupId,
      groupName,
      creditLimit: row.creditLimit?.toFixed(2) ?? null,
      minOrderAmount: row.minOrderAmount?.toFixed(2) ?? null,
      note: row.b2bNote,
      createdAt: row.createdAt,
    }));
  }

  async groupExists(groupId: string): Promise<boolean> {
    const [row] = await this.db()
      .select({ id: customerGroup.id })
      .from(customerGroup)
      .where(eq(customerGroup.id, groupId))
      .limit(1);
    return row !== undefined;
  }

  async listGroups(): Promise<GroupOption[]> {
    const groups = await this.db()
      .select()
      .from(customerGroup)
      .orderBy(asc(customerGroup.name));
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      discountPercent: group.discountPercent?.toString() ?? null,
    }));
  }

  async approve(userId: string, input: DealerApprovalInput): Promise<void> {
    await this.db()
      .update(customer)
      .set({
        b2bStatus: "APPROVED",
        groupId: input.groupId,
        creditLimit: dec(input.creditLimit),
        minOrderAmount: dec(input.minOrderAmount),
        approvedAt: new Date(),
        b2bNote: null,
      })
      .where(eq(customer.userId, userId));
  }

  async reject(userId: string, note: string | null): Promise<void> {
    await this.db()
      .update(customer)
      .set({
        b2bStatus: "REJECTED",
        b2bNote: note,
        groupId: null,
        approvedAt: null,
      })
      .where(eq(customer.userId, userId));
  }

  async updateTerms(userId: string, input: DealerApprovalInput): Promise<void> {
    await this.db()
      .update(customer)
      .set({
        groupId: input.groupId,
        creditLimit: dec(input.creditLimit),
        minOrderAmount: dec(input.minOrderAmount),
      })
      .where(eq(customer.userId, userId));
  }

  async outstandingDeferredTotal(userId: string): Promise<Decimal> {
    const db = this.db();
    const rows = await db
      .select({ grandTotal: order.grandTotal })
      .from(order)
      .where(
        and(
          eq(order.userId, userId),
          eq(order.paymentStatus, "PENDING"),
          notInArray(order.status, [
            "CANCELLED",
            "REFUNDED",
            "PENDING_PAYMENT",
          ]),
          exists(
            db
              .select({ one: payment.id })
              .from(payment)
              .where(
                and(
                  eq(payment.orderId, order.id),
                  eq(payment.method, "DEFERRED"),
                ),
              ),
          ),
        ),
      );
    // Toplama JS'te Decimal ile yapılır: SQL SUM kayan nokta hatası üretebilir.
    return rows.reduce(
      (total, row) => total.plus(row.grandTotal),
      new Decimal(0),
    );
  }
}
