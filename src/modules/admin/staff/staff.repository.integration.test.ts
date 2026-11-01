import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PERMISSIONS } from "@/shared/permissions";
import { inArray } from "drizzle-orm";
import { role as roleTable, user as userTable, type Db } from "@/db";
import { createTestDb, type TestDb } from "../../../../tests/support/test-db";
import { D1StaffRepository } from "./staff.repository";

describe("D1StaffRepository", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;
  let repo: D1StaffRepository;
  const userIds: string[] = [];
  const roleIds: string[] = [];

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
    repo = new D1StaffRepository(() => db);
  });

  afterAll(async () => {
    if (userIds.length)
      await db.delete(userTable).where(inArray(userTable.id, userIds));
    if (roleIds.length)
      await db.delete(roleTable).where(inArray(roleTable.id, roleIds));
    await t.close();
  });

  it("rol oluşturur, günceller ve yetkileri değiştirir", async () => {
    const id = await repo.createRole({
      name: `Test Rol ${tag}`,
      description: null,
      permissions: [PERMISSIONS.ORDER_READ],
    });
    roleIds.push(id);
    expect(await repo.roleNameTaken(`test rol ${tag}`)).toBe(true);
    expect(await repo.roleNameTaken(`test rol ${tag}`, id)).toBe(false);

    await repo.updateRole(id, {
      name: `Test Rol ${tag}`,
      description: "Açıklama",
      permissions: [PERMISSIONS.ORDER_READ, PERMISSIONS.REPORT_VIEW],
    });
    const role = await repo.findRole(id);
    expect(role).toMatchObject({
      description: "Açıklama",
      isSystem: false,
      userCount: 0,
    });
    expect(role?.permissions).toEqual(["order.read", "report.view"]);
  });

  it("personel oluşturur ve yönetici sayımında rol/kullanıcı katkısını hariç tutar", async () => {
    const managerRole = await repo.createRole({
      name: `Yönetici ${tag}`,
      description: null,
      permissions: [PERMISSIONS.ROLE_MANAGE],
    });
    roleIds.push(managerRole);

    const before = await repo.countActiveManagers({});
    const userId = await repo.createStaff({
      email: `staff-${tag}@example.com`,
      firstName: "Test",
      lastName: "Personel",
      roleIds: [managerRole],
    });
    userIds.push(userId);

    expect(await repo.emailTaken(`staff-${tag}@example.com`)).toBe(true);
    expect(await repo.countActiveManagers({})).toBe(before + 1);
    expect(await repo.countActiveManagers({ userId })).toBe(before);
    expect(await repo.countActiveManagers({ roleId: managerRole })).toBe(
      before,
    );

    await repo.setActive(userId, false);
    expect(await repo.countActiveManagers({})).toBe(before);

    const staff = await repo.findStaff(userId);
    expect(staff).toMatchObject({ isActive: false, hasPassword: false });
  });
});
