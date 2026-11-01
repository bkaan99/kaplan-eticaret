import { argon2idAsync } from "@noble/hashes/argon2.js";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hashed: string, plain: string): Promise<boolean>;
}

const PREFIX = "argon2id$";
/** Workers bellek sınırına uygun maliyet (kibibytes). */
const MEMORY_KIB = 19_456;
const TIME_COST = 2;
const PARALLELISM = 1;
const DK_LEN = 32;

function encode(salt: Uint8Array, hash: Uint8Array): string {
  return `${PREFIX}${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

function parse(encoded: string): { salt: Uint8Array; hash: Uint8Array } | null {
  if (!encoded.startsWith(PREFIX)) return null;
  const parts = encoded.slice(PREFIX.length).split("$");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    return { salt: hexToBytes(parts[0]), hash: hexToBytes(parts[1]) };
  } catch {
    return null;
  }
}

async function derive(plain: string, salt: Uint8Array): Promise<Uint8Array> {
  return argon2idAsync(plain, salt, {
    t: TIME_COST,
    m: MEMORY_KIB,
    p: PARALLELISM,
    dkLen: DK_LEN,
  });
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/**
 * Workers uyumlu argon2id (@noble/hashes).
 * Eski `@node-rs/argon2` PHC hash'leri desteklenmez; staging/seed yeni format üretir.
 */
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await derive(plain, salt);
    return encode(salt, hash);
  }

  async verify(hashed: string, plain: string): Promise<boolean> {
    const parsed = parse(hashed);
    if (!parsed) return false;
    const derived = await derive(plain, parsed.salt);
    return timingSafeEqual(derived, parsed.hash);
  }
}
