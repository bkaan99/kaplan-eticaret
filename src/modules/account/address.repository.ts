import type { Prisma } from "../../../generated/prisma/client";
import type { PrismaClient } from "@/shared/prisma-client";
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

const select = {
  id: true,
  title: true,
  firstName: true,
  lastName: true,
  phone: true,
  city: true,
  district: true,
  neighborhood: true,
  addressLine: true,
  postalCode: true,
  invoiceType: true,
  nationalId: true,
  companyName: true,
  taxNumber: true,
  taxOffice: true,
  isDefaultShipping: true,
  isDefaultBilling: true,
} as const;

export class PrismaAddressRepository implements AddressRepository {
  constructor(private readonly db: () => PrismaClient) {}

  list(userId: string): Promise<SavedAddress[]> {
    return this.db().address.findMany({
      where: { userId },
      orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "asc" }],
      select,
    });
  }

  count(userId: string): Promise<number> {
    return this.db().address.count({ where: { userId } });
  }

  find(userId: string, id: string): Promise<SavedAddress | null> {
    return this.db().address.findFirst({ where: { id, userId }, select });
  }

  async create(userId: string, input: SavedAddressInput): Promise<string> {
    const db = this.db();
    // Önce varsayılan bayrakları temizle, sonra ekle (dizi formu: işlemler önceden bilinir).
    // Varsayılan bayrağı yalnızca tek adreste bulunur.
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (input.isDefaultShipping) {
      ops.push(
        db.address.updateMany({
          where: { userId },
          data: { isDefaultShipping: false },
        }),
      );
    }
    if (input.isDefaultBilling) {
      ops.push(
        db.address.updateMany({
          where: { userId },
          data: { isDefaultBilling: false },
        }),
      );
    }
    ops.push(
      db.address.create({
        data: { ...input, userId },
        select: { id: true },
      }),
    );

    const results = await db.$transaction(ops);
    return (results[results.length - 1] as { id: string }).id;
  }

  async update(
    userId: string,
    id: string,
    input: SavedAddressInput,
  ): Promise<boolean> {
    const db = this.db();
    const owned = await db.address.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) return false;

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (input.isDefaultShipping) {
      ops.push(
        db.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefaultShipping: false },
        }),
      );
    }
    if (input.isDefaultBilling) {
      ops.push(
        db.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefaultBilling: false },
        }),
      );
    }
    ops.push(db.address.update({ where: { id }, data: input }));

    await db.$transaction(ops);
    return true;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.db().address.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}
