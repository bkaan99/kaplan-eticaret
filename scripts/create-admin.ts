import { createAdminUser } from "./lib/create-admin-user";
import { openDb } from "./lib/d1";

/**
 * Kullanım: npx tsx scripts/create-admin.ts <e-posta> <parola> [ad] [soyad] [--remote]
 * Aynı e-posta varsa parola ve rol güncellenir.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const remote = args.includes("--remote");
  const [email, password, firstName = "Admin", lastName = "Kullanıcı"] = args.filter(
    (arg) => arg !== "--remote",
  );

  if (!email || !password) {
    throw new Error("Kullanım: create-admin <e-posta> <parola> [ad] [soyad] [--remote]");
  }

  const { db, close } = await openDb({ remote });
  try {
    const created = await createAdminUser(db, { email, password, firstName, lastName });
    console.log(`Yönetici hazır: ${created}`);
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
