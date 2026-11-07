/**
 * Canlıya çıkış koruması: yalnızca temiz ve güncel `main` dalından deploy edilir.
 * Aksi halde (başka dal, kaydedilmemiş değişiklik, origin/main'in gerisinde) komutu durdurur.
 * Bilinçli bir istisna için: ALLOW_DEPLOY_FROM_BRANCH=1 npm run deploy
 */
import { execSync } from "node:child_process";

const run = (command) => execSync(command, { encoding: "utf8" }).trim();

function fail(message) {
  console.error(`\n✖ Deploy durduruldu: ${message}`);
  console.error("  Bilinçli istisna için: ALLOW_DEPLOY_FROM_BRANCH=1 npm run deploy\n");
  process.exit(1);
}

if (process.env.ALLOW_DEPLOY_FROM_BRANCH === "1") {
  console.warn("⚠ ALLOW_DEPLOY_FROM_BRANCH=1: main koruması atlandı.");
  process.exit(0);
}

const branch = run("git rev-parse --abbrev-ref HEAD");
if (branch !== "main") fail(`dal "${branch}"; yalnızca main'den deploy edilir.`);

if (run("git status --porcelain")) fail("kaydedilmemiş değişiklik var.");

try {
  run("git fetch origin main --quiet");
} catch {
  fail("origin/main alınamadı (ağ bağlantısı?).");
}

const [ahead, behind] = run("git rev-list --left-right --count HEAD...origin/main")
  .split(/\s+/)
  .map(Number);
if (behind > 0) fail(`main, origin/main'in ${behind} commit gerisinde; önce git pull.`);
if (ahead > 0) fail(`${ahead} commit henüz origin/main'e gönderilmemiş; önce git push.`);

console.log("✓ Deploy koruması geçti: temiz ve güncel main.");
