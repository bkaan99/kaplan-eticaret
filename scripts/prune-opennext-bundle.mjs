/**
 * OpenNext, package.json bağımlılıklarını Workers bundle'a kopyalar.
 * Prisma CLI / diğer diyalekt WASM'leri 64 MiB limitini aşıyor — D1 için gereksizleri sil.
 */
import { rmSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = ".open-next/server-functions/default/node_modules";

const removePaths = [
  "prisma",
  "@prisma/dev",
  "@prisma/adapter-better-sqlite3",
  "@prisma/adapter-pg",
  "@prisma/engines",
  "@prisma/fetch-engine",
  "@prisma/get-platform",
  "@prisma/studio-core",
  "@prisma/query-plan-executor",
  "better-sqlite3",
  "pg",
  "pg-boss",
];

for (const rel of removePaths) {
  const full = join(root, rel);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    console.log("silindi:", rel);
  }
}

const wasmKill =
  /(sqlserver|cockroachdb|postgresql|mysql|pglite|schema_engine|prisma_schema_build|initdb|pg_dump)/i;

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full);
    else if (name.endsWith(".wasm") && wasmKill.test(name)) {
      rmSync(full, { force: true });
      console.log("wasm silindi:", name);
    }
  }
}

walk(".open-next");
console.log("OpenNext bundle budandı.");
