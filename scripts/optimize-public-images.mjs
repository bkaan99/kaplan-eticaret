import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

async function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, out);
    else if (/\.(jpe?g|png)$/i.test(ent.name) && !ent.name.includes("favicon")) {
      out.push(p);
    }
  }
  return out;
}

const root = "public/images";
const files = await walk(root);
let saved = 0;

for (const file of files) {
  const before = fs.statSync(file).size;
  if (before < 40_000) continue;

  const rel = path.relative(root, file);
  const isLogo = rel.startsWith(`logo${path.sep}`);
  const isHero = rel.startsWith(`hero${path.sep}`);
  const maxEdge = isLogo ? 288 : isHero ? 1920 : 1400;
  const quality = isLogo ? 82 : 78;
  const webpPath = file.replace(/\.(jpe?g|png)$/i, ".webp");

  const pipeline = sharp(file)
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    });

  await pipeline.clone().webp({ quality, effort: 4 }).toFile(webpPath);

  if (/\.jpe?g$/i.test(file)) {
    const tmp = `${file}.tmp.jpg`;
    await pipeline
      .clone()
      .jpeg({ quality: Math.min(quality + 2, 85), mozjpeg: true })
      .toFile(tmp);
    fs.renameSync(tmp, file);
  }

  const afterJpg = fs.statSync(file).size;
  const afterWebp = fs.statSync(webpPath).size;
  saved += Math.max(0, before - afterJpg);
  console.log(
    `${rel}: ${(before / 1024).toFixed(0)}K → jpg ${(afterJpg / 1024).toFixed(0)}K + webp ${(afterWebp / 1024).toFixed(0)}K`,
  );
}

console.log(`recompressed_jpg_saved_approx_kb ${Math.round(saved / 1024)}`);
