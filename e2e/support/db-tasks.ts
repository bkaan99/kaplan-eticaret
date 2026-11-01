import "dotenv/config";
import { like } from "drizzle-orm";
import { order, user } from "../../src/db";
import { createAdminUser } from "../../scripts/lib/create-admin-user";
import { openDb } from "../../scripts/lib/d1";

/**
 * Playwright'ın CJS yükleyicisi ESM modüllerini yükleyemediğinden
 * veritabanı işleri tsx ile ayrı bir süreçte çalışır (yerel D1: `.wrangler/state`).
 * Kullanım: tsx e2e/support/db-tasks.ts <setup|cleanup>
 */
const PREFIX = "e2e-";

async function main(): Promise<void> {
  const task = process.argv[2];

  const { db, close } = await openDb();
  try {
    if (task === "setup") {
      const email = process.env["E2E_ADMIN_EMAIL"];
      const password = process.env["E2E_ADMIN_PASSWORD"];
      if (!email || !password) throw new Error("Test yöneticisi tanımlı değil");
      await createAdminUser(db, {
        email,
        password,
        firstName: "E2E",
        lastName: "Yönetici",
      });
    } else if (task === "cleanup") {
      try {
        await db.delete(order).where(like(order.guestEmail, `${PREFIX}%`));
        await db.delete(user).where(like(user.email, `${PREFIX}%`));
      } catch {
        // Bağımlı kayıtlar silmeyi engellerse hesapları pasifleştir.
        await db.update(user).set({ isActive: false }).where(like(user.email, `${PREFIX}%`));
      }
    } else {
      throw new Error(`Bilinmeyen görev: ${task}`);
    }
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
