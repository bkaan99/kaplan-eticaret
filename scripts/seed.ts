/**
 * Başlangıç verisi ve (isteğe bağlı) yönetici hesabı.
 * Kullanım:
 *   npx tsx scripts/seed.ts                                  # yerel D1
 *   npx tsx scripts/seed.ts --remote                         # Cloudflare D1
 *   npx tsx scripts/seed.ts --remote --admin admin@example.com 'Parola12345!'
 */
import { runSeed } from "../db/seed";
import { createAdminUser } from "./lib/create-admin-user";
import { openDb } from "./lib/d1";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const remote = args.includes("--remote");
  const adminIdx = args.indexOf("--admin");
  const adminEmail = adminIdx >= 0 ? args[adminIdx + 1] : undefined;
  const adminPassword = adminIdx >= 0 ? args[adminIdx + 2] : undefined;

  const { db, close } = await openDb({ remote });
  try {
    await runSeed(db);
    console.log(`${remote ? "Uzak" : "Yerel"} D1 seed tamamlandı.`);

    if (adminEmail && adminPassword) {
      const email = await createAdminUser(db, {
        email: adminEmail,
        password: adminPassword,
        firstName: "Admin",
        lastName: "Kullanıcı",
      });
      console.log(`Yönetici hazır: ${email}`);
    }
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
