import { eq } from "drizzle-orm";
import { role, user, userRole, type Db } from "../../src/db";
import { Argon2PasswordHasher } from "../../src/modules/auth/password-hasher";

export const MIN_ADMIN_PASSWORD_LENGTH = 10;

export interface AdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Yönetici kullanıcıyı oluşturur veya parolasını ve rolünü günceller. */
export async function createAdminUser(db: Db, input: AdminInput): Promise<string> {
  if (input.password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`Parola en az ${MIN_ADMIN_PASSWORD_LENGTH} karakter olmalı`);
  }

  const [adminRole] = await db.select({ id: role.id }).from(role).where(eq(role.name, "admin"));
  if (!adminRole) {
    throw new Error("admin rolü yok. Önce `npm run db:seed` çalıştırın.");
  }

  const passwordHash = await new Argon2PasswordHasher().hash(input.password);
  const email = input.email.trim().toLowerCase();

  await db
    .insert(user)
    .values({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      type: "STAFF",
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: user.email,
      set: { passwordHash, type: "STAFF", isActive: true, updatedAt: new Date() },
    });
  const [saved] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));

  await db.insert(userRole).values({ userId: saved!.id, roleId: adminRole.id }).onConflictDoNothing();

  return email;
}
