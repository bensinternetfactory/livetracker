/**
 * Client-side hashing utilities
 * Mirrors the token hashing from convex/lib/hash.ts
 */

/**
 * Hash a session token using SHA-256
 * Used to look up sessions by their hashed token
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
