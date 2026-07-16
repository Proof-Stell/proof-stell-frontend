/**
 * Client-side document hashing utility using the Web Crypto API.
 * All hashing happens entirely in the browser — no file data is ever uploaded
 * during this step. The resulting hex string is what gets sent on-chain.
 */

/**
 * Hashes an ArrayBuffer using SHA-256 and returns a lowercase hex string.
 */
export async function sha256Buffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hashes a File object using SHA-256.
 * Returns a lowercase hex string (64 characters).
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256Buffer(buffer);
}

/**
 * Hashes a plain string using SHA-256.
 * Useful for hashing credential IDs or metadata strings.
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Returns a shortened display version of a hash, e.g. "3f8a...c92d".
 * @param hash Full 64-character hex hash
 * @param chars How many characters to show at each end (default 4)
 */
export function shortHash(hash: string, chars = 4): string {
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/**
 * Formats a hash as a 0x-prefixed string for display.
 */
export function formatHash(hash: string): string {
  return hash.startsWith("0x") ? hash : `0x${hash}`;
}
