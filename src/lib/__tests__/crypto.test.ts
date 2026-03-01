import { describe, it, expect, vi, beforeEach } from "vitest";

describe("crypto", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv(
      "ENCRYPTION_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    );
  });

  it("encrypts and decrypts a string round-trip", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const plaintext = "super-secret-oauth-token-12345";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext (random IV)", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const plaintext = "same-input-different-output";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with wrong key", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("secret");

    vi.resetModules();
    vi.stubEnv(
      "ENCRYPTION_KEY",
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    );
    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt(encrypted)).toThrow();
  });

  it("fails to decrypt tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("secret");
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff; // flip last byte
    const tampered = buf.toString("base64");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("fails on too-short data", async () => {
    const { decrypt } = await import("@/lib/crypto");
    const tooShort = Buffer.from("short").toString("base64");
    expect(() => decrypt(tooShort)).toThrow("too short");
  });

  it("handles empty string", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles unicode content", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const text = "Hello 世界 🌍 مرحبا";
    const encrypted = encrypt(text);
    expect(decrypt(encrypted)).toBe(text);
  });
});
