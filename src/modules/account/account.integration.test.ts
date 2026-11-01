import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPrismaClient,
  type PrismaClient,
} from "@/shared/prisma-client-node";
import { Argon2PasswordHasher } from "../auth/password-hasher";
import { AuthService } from "../auth/auth.service";
import type {
  AuthUserRecord,
  AuthUserRepository,
} from "../auth/auth.repository";
import { D1AccountRepository } from "./account.repository";
import { AccountService, type AccountMailer } from "./account.service";

describe("Hesap (veritabanı)", () => {
  const tag = randomUUID().slice(0, 8);
  let t: TestDb;
  let db: Db;

  beforeAll(async () => {
    t = await createTestDb();
    db = t.db;
  });

  afterAll(async () => {
    await t.close();
  });

  const userByEmail = async (email: string) =>
    db.query.user.findFirst({
      where: eq(userTable.email, email),
      with: { customer: true },
    });

  it("kayıt olur, doğrular, şifre sıfırlar ve yeni parolayla giriş yapar", async () => {
    const sent: { verify: string[]; reset: string[] } = {
      verify: [],
      reset: [],
    };
    const mailer: AccountMailer = {
      sendEmailVerification: async (_e, link) => void sent.verify.push(link),
      sendPasswordReset: async (_e, link) => void sent.reset.push(link),
    };
    const hasher = new Argon2PasswordHasher();
    const service = new AccountService({
      accounts: new D1AccountRepository(() => db),
      hasher,
      mailer,
      secret: "s".repeat(32),
      baseUrl: "https://site.test",
    });
    const email = `hesap-${tag}@example.com`;
    const tokenOf = (link: string) =>
      decodeURIComponent(new URL(link).searchParams.get("token")!);

    await service.register({
      email,
      password: "ilkparola12345",
      firstName: "Ali",
      lastName: "Veli",
      phone: null,
    });

    const created = (await userByEmail(email))!;
    expect(created.type).toBe("CUSTOMER");
    expect(created.customer).not.toBeNull();
    expect(created.emailVerifiedAt).toBeNull();
    expect(created.passwordHash).not.toContain("ilkparola");

    await service.verifyEmail(tokenOf(sent.verify[0]!));
    expect((await userByEmail(email))!.emailVerifiedAt).not.toBeNull();

    await service.requestPasswordReset(email);
    await service.resetPassword(tokenOf(sent.reset[0]!), "yeniparola12345");

    const users: AuthUserRepository = {
      findByEmail: async (value) => {
        const row = await userByEmail(value);
        return row
          ? ({
              id: row.id,
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              type: row.type,
              isActive: row.isActive,
              anonymized: false,
              passwordHash: row.passwordHash,
              failedLoginCount: row.failedLoginCount,
              lockedUntil: row.lockedUntil,
              permissions: [],
            } satisfies AuthUserRecord)
          : null;
      },
      findById: async () => null,
      saveLoginState: async () => {},
    };
    const auth = new AuthService({ users, hasher });

    expect(await auth.authenticate(email, "ilkparola12345")).toBeNull();
    expect((await auth.authenticate(email, "yeniparola12345"))?.email).toBe(
      email,
    );
  });

  it("aynı e-postayla eşzamanlı iki kayıttan yalnızca biri başarılı olur", async () => {
    const repo = new D1AccountRepository(() => db);
    const hasher = new Argon2PasswordHasher();
    const service = new AccountService({
      accounts: repo,
      hasher,
      mailer: {
        sendEmailVerification: async () => {},
        sendPasswordReset: async () => {},
      },
      secret: "s".repeat(32),
      baseUrl: "https://site.test",
    });
    const input = {
      email: `yaris-${tag}@example.com`,
      password: "ilkparola12345",
      firstName: "Ali",
      lastName: "Veli",
      phone: null,
    };

    const results = await Promise.allSettled([
      service.register(input),
      service.register(input),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (
        await db
          .select({ n: count() })
          .from(userTable)
          .where(eq(userTable.email, input.email))
      )[0]!.n,
    ).toBe(1);
  });
});
