import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { wholesaleLead } from "@/db/schema";
import type { Db } from "@/shared/db";
import type {
  WholesaleLeadInput,
  WholesaleLeadRecord,
  WholesaleLeadStatus,
} from "./wholesale.types";

export interface WholesaleLeadRepository {
  create(input: WholesaleLeadInput): Promise<string>;
  list(status?: WholesaleLeadStatus): Promise<WholesaleLeadRecord[]>;
  findById(id: string): Promise<WholesaleLeadRecord | null>;
  updateStatus(
    id: string,
    status: WholesaleLeadStatus,
    adminNote: string | null,
  ): Promise<void>;
  countByStatus(status: WholesaleLeadStatus): Promise<number>;
}

function mapRow(
  row: typeof wholesaleLead.$inferSelect,
): WholesaleLeadRecord {
  return {
    id: row.id,
    companyName: row.companyName,
    email: row.email,
    phone: row.phone,
    city: row.city,
    businessType: row.businessType,
    orderVolume: row.orderVolume,
    details: row.details,
    contactChannels: row.contactChannels ?? [],
    note: row.note,
    status: row.status,
    adminNote: row.adminNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class D1WholesaleLeadRepository implements WholesaleLeadRepository {
  constructor(private readonly db: () => Db) {}

  async create(input: WholesaleLeadInput): Promise<string> {
    const [row] = await this.db()
      .insert(wholesaleLead)
      .values({
        companyName: input.companyName,
        email: input.email,
        phone: input.phone,
        city: input.city,
        businessType: input.businessType,
        orderVolume: input.orderVolume,
        details: input.details,
        contactChannels: input.contactChannels,
        note: input.note,
        status: "NEW",
      })
      .returning({ id: wholesaleLead.id });
    return row!.id;
  }

  async list(status?: WholesaleLeadStatus): Promise<WholesaleLeadRecord[]> {
    const rows = await this.db()
      .select()
      .from(wholesaleLead)
      .where(status ? eq(wholesaleLead.status, status) : undefined)
      .orderBy(desc(wholesaleLead.createdAt));
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<WholesaleLeadRecord | null> {
    const [row] = await this.db()
      .select()
      .from(wholesaleLead)
      .where(eq(wholesaleLead.id, id))
      .limit(1);
    return row ? mapRow(row) : null;
  }

  async updateStatus(
    id: string,
    status: WholesaleLeadStatus,
    adminNote: string | null,
  ): Promise<void> {
    await this.db()
      .update(wholesaleLead)
      .set({
        status,
        adminNote,
        updatedAt: new Date(),
      })
      .where(eq(wholesaleLead.id, id));
  }

  async countByStatus(status: WholesaleLeadStatus): Promise<number> {
    const [row] = await this.db()
      .select({ value: count() })
      .from(wholesaleLead)
      .where(and(eq(wholesaleLead.status, status)));
    return row?.value ?? 0;
  }
}
