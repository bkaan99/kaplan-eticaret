import { eq } from "drizzle-orm";
import {
  customer,
  isUniqueViolation,
  newId,
  runBatch,
  user,
  type Db,
} from "@/db";
import { ConflictError } from "@/shared/errors";
import type { AccountRepository, AccountUser } from "./account.service";

export class D1AccountRepository implements AccountRepository {
  constructor(private readonly db: () => Db) {}

  private toUser(row: {
    id: string;
    email: string;
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
    isActive: boolean;
    anonymizedAt: Date | null;
    type: "CUSTOMER" | "STAFF";
    firstName: string;
    lastName: string;
  }): AccountUser {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      emailVerified: row.emailVerifiedAt !== null,
      isActive: row.isActive && row.anonymizedAt === null,
      type: row.type,
      firstName: row.firstName,
      lastName: row.lastName,
    };
  }

  async findByEmail(email: string): Promise<AccountUser | null> {
    const row = await this.db().query.user.findFirst({
      where: eq(user.email, email),
    });
    return row ? this.toUser(row) : null;
  }

  async findById(id: string): Promise<AccountUser | null> {
    const row = await this.db().query.user.findFirst({
      where: eq(user.id, id),
    });
    return row ? this.toUser(row) : null;
  }

  async createCustomer(data: {
    email: string;
    passwordHash: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    emailVerified?: boolean;
  }): Promise<AccountUser> {
    const db = this.db();
    const userId = newId();
    try {
      // Kullanıcı ve müşteri kaydı tek batch'te: ya ikisi de oluşur ya hiçbiri.
      const [created] = await runBatch(db, [
        db
          .insert(user)
          .values({
            id: userId,
            email: data.email,
            passwordHash: data.passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            type: "CUSTOMER",
            emailVerifiedAt: data.emailVerified ? new Date() : null,
          })
          .returning(),
        db.insert(customer).values({ userId }),
      ]);
      return this.toUser((created as (typeof user.$inferSelect)[])[0]!);
    } catch (error) {
      // Eşzamanlı kayıtta benzersizlik kısıtı yarışı kaybedenin hatasıdır.
      if (isUniqueViolation(error)) {
        throw new ConflictError("Bu e-posta adresiyle zaten bir hesap var");
      }
      throw error;
    }
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.db()
      .update(user)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(user.id, userId));
  }

  async findProfile(userId: string) {
    const row = await this.db().query.user.findFirst({
      where: eq(user.id, userId),
      columns: { email: true, firstName: true, lastName: true, phone: true },
    });
    return row ?? null;
  }

  async updateProfile(
    userId: string,
    data: { firstName: string; lastName: string; phone: string | null },
  ): Promise<void> {
    await this.db().update(user).set(data).where(eq(user.id, userId));
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db()
      .update(user)
      // Parola değişince hesap kilidi de açılır.
      .set({ passwordHash, failedLoginCount: 0, lockedUntil: null })
      .where(eq(user.id, userId));
  }
}
