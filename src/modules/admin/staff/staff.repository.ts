import {
  and,
  asc,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import {
  countWhere,
  newId,
  role,
  rolePermission,
  runBatch,
  user,
  userRole,
  type Db,
} from "@/db";
import { PERMISSIONS } from "@/shared/permissions";
import type { RoleInput, StaffInvite } from "./role.schema";

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

export interface StaffRecord {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  hasPassword: boolean;
  roles: { id: string; name: string }[];
}

export interface StaffRepository {
  listRoles(): Promise<RoleRecord[]>;
  findRole(id: string): Promise<RoleRecord | null>;
  findRolesByIds(ids: string[]): Promise<RoleRecord[]>;
  roleNameTaken(name: string, excludeId?: string): Promise<boolean>;
  createRole(input: RoleInput): Promise<string>;
  updateRole(id: string, input: RoleInput): Promise<void>;
  deleteRole(id: string): Promise<void>;
  listStaff(): Promise<StaffRecord[]>;
  findStaff(id: string): Promise<StaffRecord | null>;
  emailTaken(email: string): Promise<boolean>;
  createStaff(input: StaffInvite): Promise<string>;
  setRoles(userId: string, roleIds: string[]): Promise<void>;
  setActive(userId: string, isActive: boolean): Promise<void>;
  /**
   * Rol yönetebilen etkin personel sayısı; verilen kullanıcı veya rolün
   * katkısı hariç tutulur (son yöneticinin kilitlenmesini önlemek için).
   */
  countActiveManagers(exclude: {
    userId?: string;
    roleId?: string;
  }): Promise<number>;
}

const roleWith = { permissions: { columns: { permission: true } } } as const;

/** Role bağlı kullanıcı sayısı (ilişki sayımı için tek alt sorgu). */
const userCount = sql<number>`(SELECT count(*) FROM "UserRole" WHERE "UserRole"."roleId" = ${role.id})`;

function toRole(row: {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: string }[];
  userCount: number;
}): RoleRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.isSystem,
    permissions: row.permissions.map((p) => p.permission).sort(),
    userCount: Number(row.userCount),
  };
}

const staffWith = {
  roles: { with: { role: { columns: { id: true, name: true } } } },
} as const;

function toStaff(row: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  passwordHash: string | null;
  roles: { role: { id: string; name: string } }[];
}): StaffRecord {
  return {
    id: row.id,
    email: row.email,
    name: `${row.firstName} ${row.lastName}`.trim(),
    isActive: row.isActive,
    hasPassword: row.passwordHash !== null,
    roles: row.roles.map((r) => r.role),
  };
}

export class D1StaffRepository implements StaffRepository {
  constructor(private readonly db: () => Db) {}

  /** İlişkili izinler ve kullanıcı sayısıyla rol satırları. */
  private async loadRoles(
    where?: ReturnType<typeof eq>,
  ): Promise<RoleRecord[]> {
    const db = this.db();
    const rows = await db.query.role.findMany({
      where,
      with: roleWith,
      extras: { userCount: userCount.as("userCount") },
      orderBy: [desc(role.isSystem), asc(role.name)],
    });
    return rows.map(toRole);
  }

  listRoles(): Promise<RoleRecord[]> {
    return this.loadRoles();
  }

  async findRole(id: string): Promise<RoleRecord | null> {
    return (await this.loadRoles(eq(role.id, id)))[0] ?? null;
  }

  async findRolesByIds(ids: string[]): Promise<RoleRecord[]> {
    if (ids.length === 0) return [];
    return this.loadRoles(inArray(role.id, ids) as ReturnType<typeof eq>);
  }

  async roleNameTaken(name: string, excludeId?: string): Promise<boolean> {
    return (
      (await countWhere(
        this.db(),
        role,
        and(
          // Ad karşılaştırması büyük/küçük harfe duyarsızdır.
          sql`lower(${role.name}) = ${name.toLowerCase()}`,
          excludeId ? ne(role.id, excludeId) : undefined,
        ),
      )) > 0
    );
  }

  async createRole(input: RoleInput): Promise<string> {
    const db = this.db();
    const id = newId();
    await runBatch(db, [
      db
        .insert(role)
        .values({ id, name: input.name, description: input.description }),
      ...input.permissions.map((permission) =>
        db.insert(rolePermission).values({ roleId: id, permission }),
      ),
    ]);
    return id;
  }

  async updateRole(id: string, input: RoleInput): Promise<void> {
    const db = this.db();
    await runBatch(db, [
      db
        .update(role)
        .set({ name: input.name, description: input.description })
        .where(eq(role.id, id)),
      db.delete(rolePermission).where(eq(rolePermission.roleId, id)),
      ...input.permissions.map((permission) =>
        db.insert(rolePermission).values({ roleId: id, permission }),
      ),
    ]);
  }

  async deleteRole(id: string): Promise<void> {
    await this.db().delete(role).where(eq(role.id, id));
  }

  async listStaff(): Promise<StaffRecord[]> {
    const rows = await this.db().query.user.findMany({
      where: and(eq(user.type, "STAFF"), isNull(user.anonymizedAt)),
      with: staffWith,
      orderBy: [desc(user.isActive), asc(user.firstName)],
    });
    return rows.map(toStaff);
  }

  async findStaff(id: string): Promise<StaffRecord | null> {
    const row = await this.db().query.user.findFirst({
      where: and(eq(user.id, id), eq(user.type, "STAFF")),
      with: staffWith,
    });
    return row ? toStaff(row) : null;
  }

  async emailTaken(email: string): Promise<boolean> {
    return (await countWhere(this.db(), user, eq(user.email, email))) > 0;
  }

  async createStaff(input: StaffInvite): Promise<string> {
    const db = this.db();
    const id = newId();
    await runBatch(db, [
      db.insert(user).values({
        id,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        type: "STAFF",
        passwordHash: null,
      }),
      ...input.roleIds.map((roleId) =>
        db.insert(userRole).values({ userId: id, roleId }),
      ),
    ]);
    return id;
  }

  async setRoles(userId: string, roleIds: string[]): Promise<void> {
    const db = this.db();
    await runBatch(db, [
      db.delete(userRole).where(eq(userRole.userId, userId)),
      ...roleIds.map((roleId) =>
        db.insert(userRole).values({ userId, roleId }),
      ),
    ]);
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    await this.db().update(user).set({ isActive }).where(eq(user.id, userId));
  }

  countActiveManagers(exclude: {
    userId?: string;
    roleId?: string;
  }): Promise<number> {
    const db = this.db();
    return countWhere(
      db,
      user,
      and(
        eq(user.type, "STAFF"),
        eq(user.isActive, true),
        isNull(user.anonymizedAt),
        exclude.userId ? ne(user.id, exclude.userId) : undefined,
        exists(
          db
            .select({ one: userRole.userId })
            .from(userRole)
            .where(
              and(
                eq(userRole.userId, user.id),
                exclude.roleId
                  ? ne(userRole.roleId, exclude.roleId)
                  : undefined,
                exists(
                  db
                    .select({ one: rolePermission.roleId })
                    .from(rolePermission)
                    .where(
                      and(
                        eq(rolePermission.roleId, userRole.roleId),
                        eq(rolePermission.permission, PERMISSIONS.ROLE_MANAGE),
                      ),
                    ),
                ),
              ),
            ),
        ),
      ),
    );
  }
}
