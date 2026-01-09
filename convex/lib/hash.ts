/**
 * Secure hashing utilities for tokens and verification codes
 *
 * IMPORTANT: These are used for session tokens and SSN last-4 verification.
 * Never log, store, or transmit the raw values.
 */

/**
 * Generate a cryptographically random token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Generate a random salt for hashing
 */
export function generateSalt(length: number = 16): string {
  return generateToken(length);
}

/**
 * Hash a value with a salt using SHA-256
 * Used for both session tokens and SSN last-4
 */
export async function hashWithSalt(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a session token (no salt needed - token is already random)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a value against a salted hash
 */
export async function verifySaltedHash(
  value: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await hashWithSalt(value, salt);
  // Use timing-safe comparison
  if (actualHash.length !== expectedHash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < actualHash.length; i++) {
    result |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}
