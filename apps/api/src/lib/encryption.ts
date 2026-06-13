import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  hkdf as hkdfCb,
} from "node:crypto";
import { promisify } from "node:util";

const hkdf = promisify(hkdfCb);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_VERSION = 1;
const PREFIX = "$ENC$";

async function deriveKey(masterKeyHex: string, context: string): Promise<Buffer> {
  const keyBytes = Buffer.from(masterKeyHex, "hex");
  const derived = await hkdf("sha256", keyBytes, Buffer.alloc(0), context, 32);
  return Buffer.from(derived);
}

export async function encrypt(plaintext: string, masterKeyHex: string): Promise<string> {
  const key = await deriveKey(masterKeyHex, "snapotter-settings-encryption");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const blob = Buffer.concat([Buffer.from([KEY_VERSION]), iv, authTag, encrypted]);
  return `${PREFIX}${blob.toString("base64")}`;
}

export async function decrypt(
  ciphertext: string,
  masterKeyHex: string,
  previousKeyHex?: string,
): Promise<string | null> {
  if (!isEncrypted(ciphertext)) return ciphertext;

  const blob = Buffer.from(ciphertext.slice(PREFIX.length), "base64");
  const _version = blob[0];
  const iv = blob.subarray(1, 1 + IV_LENGTH);
  const authTag = blob.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = blob.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH);

  const tryDecrypt = async (keyHex: string): Promise<string | null> => {
    try {
      const key = await deriveKey(keyHex, "snapotter-settings-encryption");
      const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);
      return decipher.update(encrypted) + decipher.final("utf8");
    } catch {
      return null;
    }
  };

  const result = await tryDecrypt(masterKeyHex);
  if (result !== null) return result;
  if (previousKeyHex) return tryDecrypt(previousKeyHex);
  return null;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export async function deriveAuditHmacKey(masterKeyHex: string): Promise<Buffer> {
  return deriveKey(masterKeyHex, "snapotter-audit-hmac");
}
