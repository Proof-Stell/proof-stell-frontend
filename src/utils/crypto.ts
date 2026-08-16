/**
 * Secure Encryption/Decryption utility using native Web Crypto API (AES-GCM).
 * Fully SSR-safe and works in both Browser and Node.js test environments.
 */

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "proofstell-secure-auth-fallback-key-32chars!";

function getCrypto(): Crypto {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error("Cryptography API not available in this environment.");
}

async function getKey(): Promise<CryptoKey> {
  const crypto = getCrypto();
  const enc = new TextEncoder();
  // Pad or slice key to exactly 32 bytes (256 bits) for AES
  const rawKey = enc.encode(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts cleartext using AES-GCM and returns a combined hex string containing the IV and ciphertext.
 */
export async function encryptData(text: string): Promise<string> {
  if (!text) return "";
  try {
    const crypto = getCrypto();
    const enc = new TextEncoder();
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(text)
    );

    // Convert IV and Ciphertext to Hex
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ciphertextBuffer = new Uint8Array(encrypted);
    const ciphertextHex = Array.from(ciphertextBuffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `${ivHex}:${ciphertextHex}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt sensitive data.");
  }
}

/**
 * Decrypts a combined hex string containing IV and ciphertext.
 */
export async function decryptData(encryptedStr: string): Promise<string> {
  if (!encryptedStr) return "";
  try {
    const crypto = getCrypto();
    const parts = encryptedStr.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format. Expected iv:ciphertext.");
    }
    const [ivHex, ciphertextHex] = parts;

    // Convert Hex back to Uint8Array
    const ivMatch = ivHex.match(/.{1,2}/g);
    const ciphertextMatch = ciphertextHex.match(/.{1,2}/g);
    if (!ivMatch || !ciphertextMatch) {
      throw new Error("Invalid hex characters in encrypted string.");
    }

    const iv = new Uint8Array(ivMatch.map((byte) => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(ciphertextMatch.map((byte) => parseInt(byte, 16)));

    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}
