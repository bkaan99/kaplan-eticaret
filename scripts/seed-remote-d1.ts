/**
 * Remote D1 seed + staging admin.
 * Kullanım:
 *   npx tsx scripts/seed-remote-d1.ts
 *   npx tsx scripts/seed-remote-d1.ts --admin admin@example.com 'Parola12345!'
 */
import { getPlatformProxy } from "wrangler";
import { createAdminUser } from "./lib/create-admin-user";
import { createPrismaClientFromD1 } from "../src/shared/prisma-client-node";
import { runSeed } from "../prisma/seed";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const adminIdx = args.indexOf("--admin");
  const adminEmail = adminIdx >= 0 ? args[adminIdx + 1] : undefined;
  const adminPassword = adminIdx >= 0 ? args[adminIdx + 2] : undefined;

  // wrangler.jsonc içinde DB binding'ine `"remote": true` gerekir;
  // bu script süresince geçici config kullanır.
  const proxy = await getPlatformProxy<CloudflareEnv>({
    configPath: "wrangler.seed.jsonc",
    remoteBindings: true,
    persist: false,
  });

  try {
    if (!proxy.env.DB) {
      throw new Error("Remote D1 binding (DB) yok");
    }

    const db = createPrismaClientFromD1(proxy.env.DB);
    try {
      await runSeed(db);
      console.log("Remote D1 seed tamamlandı.");

      if (adminEmail && adminPassword) {
        const email = await createAdminUser(db, {
          email: adminEmail,
          password: adminPassword,
          firstName: "Staging",
          lastName: "Admin",
        });
        console.log(`Staging admin hazır: ${email}`);
      } else {
        console.log(
          "Admin atlandı. Örnek: npx tsx scripts/seed-remote-d1.ts --admin admin@example.com 'Parola12345!'",
        );
      }
    } finally {
      await db.$disconnect();
    }
  } finally {
    await proxy.dispose();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
