import { eq } from "drizzle-orm";
import { user as userTable, type UserType } from "@/db";
import { getDb } from "@/shared/db";
import type { LoginFailureState } from "./lockout-policy";

export interface AuthUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  type: UserType;
  isActive: boolean;
  anonymized: boolean;
  passwordHash: string | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  permissions: string[];
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: string): Promise<AuthUserRecord | null>;
  saveLoginState(userId: string, state: LoginFailureState): Promise<void>;
}

export class D1AuthUserRepository implements AuthUserRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.find(eq(userTable.email, email));
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    return this.find(eq(userTable.id, id));
  }

  private async find(
    where: ReturnType<typeof eq>,
  ): Promise<AuthUserRecord | null> {
    const row = await getDb().query.user.findFirst({
      where,
      with: { roles: { with: { role: { with: { permissions: true } } } } },
    });
    return row ? this.toRecord(row) : null;
  }

  async saveLoginState(
    userId: string,
    state: LoginFailureState,
  ): Promise<void> {
    await getDb()
      .update(userTable)
      .set({
        failedLoginCount: state.failedLoginCount,
        lockedUntil: state.lockedUntil,
      })
      .where(eq(userTable.id, userId));
  }

  private toRecord(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    type: UserType;
    isActive: boolean;
    anonymizedAt: Date | null;
    passwordHash: string | null;
    failedLoginCount: number;
    lockedUntil: Date | null;
    roles: { role: { permissions: { permission: string }[] } }[];
  }): AuthUserRecord {
    const permissions = new Set<string>();
    for (const { role } of user.roles) {
      for (const { permission } of role.permissions) {
        permissions.add(permission);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: user.type,
      isActive: user.isActive,
      anonymized: user.anonymizedAt !== null,
      passwordHash: user.passwordHash,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      permissions: [...permissions],
    };
  }
}
