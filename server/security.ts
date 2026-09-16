import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

// ==========================================
// Password hashing (scrypt, Node built-in — no extra dependency)
// ==========================================

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS: crypto.ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordCheck {
  ok: boolean;
  message?: string;
}

export function validatePasswordStrength(password: unknown): PasswordCheck {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, message: 'کلمه عبور الزامی است.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `کلمه عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.` };
  }
  if (password.length > 200) {
    return { ok: false, message: 'کلمه عبور بیش از حد طولانی است.' };
  }
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasLetter || !hasDigit) {
    return { ok: false, message: 'کلمه عبور باید حداقل شامل یک حرف و یک عدد باشد.' };
  }
  return { ok: true };
}

/** Returns `scrypt$<salt>$<hash>`. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(plain, salt, SCRYPT_KEYLEN, SCRYPT_OPTS);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

/** Constant-time verification. Returns false for any malformed stored value. */
export async function verifyPassword(plain: string, stored: string | undefined): Promise<boolean> {
  if (!stored || typeof plain !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, salt, hex] = parts;
  let expected: Buffer;
  try {
    expected = Buffer.from(hex, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEYLEN) return false;

  try {
    const derived = await scrypt(plain, salt, SCRYPT_KEYLEN, SCRYPT_OPTS);
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function isHashedPassword(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('scrypt$') && value.split('$').length === 3;
}

/** Cryptographically strong, human-typeable password for first-boot seeding. */
export function generateStrongPassword(length = 20): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  // Guarantee the generated value satisfies validatePasswordStrength.
  return `${out.slice(0, length - 2)}7a`;
}

// ==========================================
// Session tokens
// ==========================================

export interface Session {
  userId: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  ip: string;
}

/** 12 hours, sliding. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_SESSIONS_PER_USER = 10;

/** Keyed by SHA-256 of the token, so a heap/log leak does not yield usable tokens. */
const sessions = new Map<string, Session>();

function digest(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSession(userId: string, ip: string): { token: string; expiresAt: number } {
  pruneExpiredSessions();

  // Cap concurrent sessions per account.
  const owned = [...sessions.entries()].filter(([, s]) => s.userId === userId);
  if (owned.length >= MAX_SESSIONS_PER_USER) {
    owned
      .sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt)
      .slice(0, owned.length - MAX_SESSIONS_PER_USER + 1)
      .forEach(([key]) => sessions.delete(key));
  }

  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(digest(token), {
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip,
  });
  return { token, expiresAt: now + SESSION_TTL_MS };
}

export function readSession(token: string | undefined): Session | null {
  if (!token) return null;
  const key = digest(token);
  const session = sessions.get(key);
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt <= now) {
    sessions.delete(key);
    return null;
  }

  // Sliding expiry.
  session.lastSeenAt = now;
  session.expiresAt = now + SESSION_TTL_MS;
  return session;
}

export function destroySession(token: string | undefined): void {
  if (!token) return;
  sessions.delete(digest(token));
}

/** Used after a password reset / suspension / deletion to kick every active login. */
export function destroyAllSessionsForUser(userId: string): number {
  let removed = 0;
  for (const [key, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(key);
      removed++;
    }
  }
  return removed;
}

export function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(key);
  }
}

export function extractBearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/i.exec(header.trim());
  return match ? match[1] : undefined;
}

// ==========================================
// Rate limiting / brute-force protection (in-memory)
// ==========================================

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: limit - 1 };
  }

  bucket.count++;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }
  return { allowed: true, retryAfterSeconds: 0, remaining: limit - bucket.count };
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/** Housekeeping so the maps cannot grow without bound. */
export function startSecurityJanitor(intervalMs = 10 * 60 * 1000): NodeJS.Timeout {
  const timer = setInterval(() => {
    pruneExpiredSessions();
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, intervalMs);
  timer.unref?.();
  return timer;
}
