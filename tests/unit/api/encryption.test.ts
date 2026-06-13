import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  isEncrypted,
  deriveAuditHmacKey,
} from "../../../apps/api/src/lib/encryption.js";

describe("encryption", () => {
  const testKey = "a".repeat(64); // 32 bytes hex-encoded

  it("encrypts and decrypts a value", async () => {
    const plaintext = "my-secret-oidc-client-secret";
    const encrypted = await encrypt(plaintext, testKey);
    expect(encrypted).not.toBe(plaintext);
    expect(isEncrypted(encrypted)).toBe(true);
    const decrypted = await decrypt(encrypted, testKey);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext (random IV)", async () => {
    const plaintext = "same-value";
    const a = await encrypt(plaintext, testKey);
    const b = await encrypt(plaintext, testKey);
    expect(a).not.toBe(b);
  });

  it("isEncrypted returns false for plaintext", () => {
    expect(isEncrypted("just-a-normal-value")).toBe(false);
    expect(isEncrypted("")).toBe(false);
  });

  it("decrypt returns null for wrong key", async () => {
    const encrypted = await encrypt("secret", testKey);
    const wrongKey = "b".repeat(64);
    const result = await decrypt(encrypted, wrongKey);
    expect(result).toBeNull();
  });

  it("decrypt tries previous key on failure", async () => {
    const oldKey = "c".repeat(64);
    const newKey = "d".repeat(64);
    const encrypted = await encrypt("secret", oldKey);
    const result = await decrypt(encrypted, newKey, oldKey);
    expect(result).toBe("secret");
  });

  it("decrypt passes through non-encrypted values", async () => {
    const result = await decrypt("plain-text-value", testKey);
    expect(result).toBe("plain-text-value");
  });

  it("deriveAuditHmacKey produces a 32-byte buffer", async () => {
    const key = await deriveAuditHmacKey(testKey);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });
});
