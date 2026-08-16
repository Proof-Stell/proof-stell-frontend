import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "proofstell-super-secret-jwt-signing-key-value-1234!";

function base64urlEncode(str: string | Buffer): string {
  const buf = Buffer.isBuffer(str) ? str : Buffer.from(str);
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Signs a payload to generate a JWT token.
 * @param payload The custom claims to include in the token.
 * @param expiresInSeconds Duration of validity in seconds.
 */
export function signJwt(payload: Record<string, unknown>, expiresInSeconds: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();

  const encodedSignature = base64urlEncode(signature);
  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Verifies a JWT token signature and expiration.
 * @returns The parsed payload if valid, otherwise null.
 */
export function verifyJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET)
      .update(signatureInput)
      .digest();
    const encodedExpectedSignature = base64urlEncode(expectedSignature);

    if (encodedSignature !== encodedExpectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload)) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && typeof payload.exp === "number" && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
