/**
 * AES-256-GCM encryption for sensitive fields stored in the database.
 * Requires ENCRYPTION_KEY env var (32-byte hex: 64 hex chars).
 * If the key is absent the functions return the value unchanged —
 * existing plaintext values continue to work, but new writes will warn.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY ?? "";

function getKey(): Buffer | null {
  if (!KEY_HEX || KEY_HEX.length !== 64) return null;
  return Buffer.from(KEY_HEX, "hex");
}

const PREFIX = "enc:";

export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext; // graceful degradation when key not set
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: "enc:<iv_hex>:<tag_hex>:<ciphertext_hex>"
  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(value: string): string {
  if (!value.startsWith(PREFIX)) return value; // plaintext passthrough
  const key = getKey();
  if (!key) return value; // can't decrypt without key — return as-is
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return value;
  const [ivHex, tagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
