import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { openDb } from "./lib/d1";
import {
  createAdminUser,
  MIN_ADMIN_PASSWORD_LENGTH,
} from "./lib/create-admin-user";
import {
  applyEnvValues,
  buildProjectConfig,
  generateSecret,
  isSalesMode,
  isValidEmail,
  isValidHexColor,
  isValidUrl,
  type InitAnswers,
} from "./lib/init-helpers";

/**
 * Yeni müşteri projesini tek komutla kurar:
 *   npm run init-project            tam kurulum (Docker, migration, seed, admin)
 *   npm run init-project -- --skip-infra   yalnızca yapılandırma dosyaları
 */

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
const PROJECT_JSON_PATH = path.join(ROOT, "src/config/project.json");
const skipInfra = process.argv.includes("--skip-infra");

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(
  question: string,
  options: {
    defaultValue?: string;
    validate?: (value: string) => boolean;
    error?: string;
  } = {},
): Promise<string> {
  const suffix = options.defaultValue ? ` [${options.defaultValue}]` : "";

  for (;;) {
    const raw = (await rl.question(`${question}${suffix}: `)).trim();
    const value = raw || options.defaultValue || "";

    if (!options.validate || options.validate(value)) return value;
    console.log(`  ${options.error ?? "Geçersiz değer, tekrar deneyin."}`);
  }
}

async function askYesNo(
  question: string,
  defaultYes: boolean,
): Promise<boolean> {
  const hint = defaultYes ? "E/h" : "e/H";
  const value = (await ask(`${question} (${hint})`)).toLowerCase();
  if (!value) return defaultYes;
  return ["e", "evet", "y", "yes"].includes(value);
}

/** Parolayı ekrana yazdırmadan okur. */
async function askSecret(question: string): Promise<string> {
  rl.pause();
  process.stdout.write(`${question}: `);

  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (chunk: string): void => {
      for (const char of chunk) {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          stdin.setRawMode?.(false);
          stdin.off("data", onData);
          process.stdout.write("\n");
          rl.resume();
          resolve(value);
          return;
        }
        if (char === "\u0003") process.exit(1);
        if (char === "\u007f") value = value.slice(0, -1);
        else value += char;
      }
    };

    stdin.on("data", onData);
  });
}

function run(command: string, extraEnv: Record<string, string> = {}): void {
  execSync(command, {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, ...extraEnv },
  });
}

async function collectAnswers(): Promise<InitAnswers> {
  console.log("\nProje bilgileri\n");

  const siteName = await ask("Site adı", { defaultValue: "E-Ticaret" });
  const description = await ask("Kısa açıklama", {
    defaultValue: `${siteName} online mağazası`,
  });
  const appUrl = await ask("Site adresi", {
    defaultValue: "http://localhost:3000",
    validate: isValidUrl,
    error: "http:// veya https:// ile başlayan geçerli bir adres girin.",
  });
  const contactEmail = await ask("İletişim e-postası", {
    validate: isValidEmail,
    error: "Geçerli bir e-posta girin.",
  });
  const contactPhone = await ask("İletişim telefonu", {
    defaultValue: "+90 000 000 00 00",
  });
  const salesMode = await ask("Satış modu (retail / b2b / hybrid)", {
    defaultValue: "retail",
    validate: isSalesMode,
    error: "retail, b2b veya hybrid yazın.",
  });
  const guestCheckout = await askYesNo("Üyeliksiz sipariş olsun mu?", true);
  const wishlist = await askYesNo("Favoriler olsun mu?", true);
  const primaryColor = await ask("Ana renk (hex)", {
    defaultValue: "#111827",
    validate: isValidHexColor,
    error: "#RRGGBB biçiminde girin.",
  });
  const accentColor = await ask("Vurgu rengi (hex)", {
    defaultValue: "#2563eb",
    validate: isValidHexColor,
    error: "#RRGGBB biçiminde girin.",
  });

  if (!isSalesMode(salesMode)) throw new Error("Geçersiz satış modu");

  return {
    siteName,
    description,
    appUrl,
    contactEmail,
    contactPhone,
    salesMode,
    guestCheckout,
    wishlist,
    primaryColor,
    accentColor,
  };
}

function writeProjectConfig(answers: InitAnswers): void {
  const config = buildProjectConfig(answers);
  writeFileSync(PROJECT_JSON_PATH, `${JSON.stringify(config, null, 2)}\n`);
  console.log("✓ src/config/project.json yazıldı");
}

async function writeEnv(answers: InitAnswers): Promise<string> {
  if (existsSync(ENV_PATH)) {
    const overwrite = await askYesNo(
      ".env zaten var. Üzerine yazılsın mı?",
      false,
    );
    if (!overwrite) {
      console.log("• Mevcut .env korundu");
      const existing = readFileSync(ENV_PATH, "utf8");
      const match = /^DATABASE_URL=(.*)$/m.exec(existing);
      return match?.[1] ?? "";
    }
  }

  const template = readFileSync(ENV_EXAMPLE_PATH, "utf8");
  const env = applyEnvValues(template, {
    APP_URL: answers.appUrl,
    AUTH_SECRET: generateSecret(),
    MAIL_FROM: `"${answers.siteName} <no-reply@localhost>"`,
  });
  writeFileSync(ENV_PATH, env);
  console.log("✓ .env yazıldı (AUTH_SECRET üretildi)");

  return /^DATABASE_URL=(.*)$/m.exec(env)?.[1] ?? "";
}

async function setupInfrastructure(): Promise<void> {
  console.log("\nAltyapı\n");

  // Yerel D1 (.wrangler/state): migration'lar ve başlangıç verisi
  run("npm run db:migrate-local");
  run("npm run db:seed");
  console.log("✓ Yerel veritabanı hazır");

  console.log("\nYönetici hesabı\n");
  const adminEmail = await ask("Yönetici e-postası", {
    validate: isValidEmail,
    error: "Geçerli bir e-posta girin.",
  });

  let adminPassword = "";
  let generated = false;
  for (;;) {
    adminPassword = await askSecret(
      `Yönetici parolası (en az ${MIN_ADMIN_PASSWORD_LENGTH} karakter, boş bırakırsanız üretilir)`,
    );
    if (!adminPassword) {
      adminPassword = generateSecret(12);
      generated = true;
      break;
    }
    if (adminPassword.length >= MIN_ADMIN_PASSWORD_LENGTH) break;
    console.log(`  Parola en az ${MIN_ADMIN_PASSWORD_LENGTH} karakter olmalı.`);
  }

  const { db, close } = await openDb();
  try {
    await createAdminUser(db, {
      email: adminEmail,
      password: adminPassword,
      firstName: "Admin",
      lastName: "Kullanıcı",
    });
  } finally {
    await close();
  }

  console.log(`✓ Yönetici hazır: ${adminEmail}`);
  if (generated) {
    console.log(`  Üretilen parola (bir kez gösterilir): ${adminPassword}`);
  }
}

async function main(): Promise<void> {
  if (!existsSync(ENV_EXAMPLE_PATH)) {
    throw new Error(".env.example bulunamadı; proje kök dizininde çalıştırın.");
  }

  const answers = await collectAnswers();
  writeProjectConfig(answers);
  await writeEnv(answers);

  if (skipInfra) {
    console.log("\n--skip-infra: migration ve seed atlandı.");
  } else {
    await setupInfrastructure();
  }

  console.log("\nKurulum tamamlandı. Başlatmak için:\n");
  console.log("  npm run dev      # uygulama\n");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
