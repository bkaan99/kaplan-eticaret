import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { address, newId, runBatch, type Db } from "@/db";
import type { SavedAddressInput } from "./address.schema";

export interface SavedAddress {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  postalCode: string | null;
  invoiceType: "INDIVIDUAL" | "CORPORATE";
  nationalId: string | null;
  companyName: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface AddressRepository {
  list(userId: string): Promise<SavedAddress[]>;
  count(userId: string): Promise<number>;
  find(userId: string, id: string): Promise<SavedAddress | null>;
  create(userId: string, input: SavedAddressInput): Promise<string>;
  update(
    userId: string,
    id: string,
    input: SavedAddressInput,
  ): Promise<boolean>;
  delete(userId: string, id: string): Promise<boolean>;
}

const columns = {
  id: address.id,
  title: address.title,
  firstName: address.firstName,
  lastName: address.lastName,
  phone: address.phone,
  city: address.city,
  district: address.district,
  neighborhood: address.neighborhood,
  addressLine: address.addressLine,
  postalCode: address.postalCode,
  invoiceType: address.invoiceType,
  nationalId: address.nationalId,
  companyName: address.companyName,
  taxNumber: address.taxNumber,
  taxOffice: address.taxOffice,
  isDefaultShipping: address.isDefaultShipping,
  isDefaultBilling: address.isDefaultBilling,
} as const;

export class D1AddressRepository implements AddressRepository {
  constructor(private readonly db: () => Db) {}

  list(userId: string): Promise<SavedAddress[]> {
    return this.db()
      .select(columns)
      .from(address)
      .where(eq(address.userId, userId))
      .orderBy(desc(address.isDefaultShipping), asc(address.createdAt));
  }

  async count(userId: string): Promise<number> {
    const [row] = await this.db()
      .select({ n: count() })
      .from(address)
      .where(eq(address.userId, userId));
    return row!.n;
  }

  async find(userId: string, id: string): Promise<SavedAddress | null> {
    const [row] = await this.db()
      .select(columns)
      .from(address)
      .where(and(eq(address.id, id), eq(address.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  async create(userId: string, input: SavedAddressInput): Promise<string> {
    const db = this.db();
    // Varsayılan bayrağı yalnızca tek adreste bulunur: önce temizle, sonra ekle (tek batch, atomik).
    const ops: Parameters<typeof runBatch>[1] = [];
    if (input.isDefaultShipping) {
      ops.push(
        db
          .update(address)
          .set({ isDefaultShipping: false })
          .where(eq(address.userId, userId)),
      );
    }
    if (input.isDefaultBilling) {
      ops.push(
        db
          .update(address)
          .set({ isDefaultBilling: false })
          .where(eq(address.userId, userId)),
      );
    }
    const id = newId();
    ops.push(db.insert(address).values({ ...input, id, userId }));

    await runBatch(db, ops);
    return id;
  }

  async update(
    userId: string,
    id: string,
    input: SavedAddressInput,
  ): Promise<boolean> {
    const db = this.db();
    const owned = await this.find(userId, id);
    if (!owned) return false;

    const ops: Parameters<typeof runBatch>[1] = [];
    if (input.isDefaultShipping) {
      ops.push(
        db
          .update(address)
          .set({ isDefaultShipping: false })
          .where(and(eq(address.userId, userId), ne(address.id, id))),
      );
    }
    if (input.isDefaultBilling) {
      ops.push(
        db
          .update(address)
          .set({ isDefaultBilling: false })
          .where(and(eq(address.userId, userId), ne(address.id, id))),
      );
    }
    ops.push(db.update(address).set(input).where(eq(address.id, id)));

    await runBatch(db, ops);
    return true;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.db()
      .delete(address)
      .where(and(eq(address.id, id), eq(address.userId, userId)))
      .run();
    return result.meta.changes > 0;
  }
}
