import bcrypt from 'bcryptjs'
import { createHash, timingSafeEqual } from 'crypto'

/**
 * Password hashing utilities.
 *
 * - New passwords are hashed with bcrypt (salted, cost factor 10).
 * - `verifyPassword` supports legacy SHA-256 hashes for backward compatibility
 *   (they are upgraded to bcrypt on successful login via `rehashIfNeeded`).
 */

const BCRYPT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

function sha256Hex(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

/**
 * Verify a password against a stored hash.
 * Returns true if the password matches either bcrypt (preferred) or legacy SHA-256.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false

  // bcrypt hashes start with $2a$, $2b$ or $2y$
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash)
  }

  // Legacy SHA-256 (hex, 64 chars) — constant-time comparison
  if (/^[a-f0-9]{64}$/i.test(hash)) {
    const candidate = Buffer.from(sha256Hex(password), 'hex')
    const stored = Buffer.from(hash, 'hex')
    return candidate.length === stored.length && timingSafeEqual(candidate, stored)
  }

  return false
}

/**
 * If the stored hash is a legacy SHA-256 hash, re-hash with bcrypt and return the new hash.
 * Returns null when no re-hash is needed.
 */
export async function rehashIfNeeded(password: string, hash: string): Promise<string | null> {
  if (hash && !hash.startsWith('$2')) {
    return bcrypt.hash(password, BCRYPT_ROUNDS)
  }
  return null
}
