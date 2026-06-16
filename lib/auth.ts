import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "qoppy_session";
export const ADMIN_COOKIE = "qoppy_admin";

function secret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-only-insecure-secret"
  );
}

// --- Password hashing (scrypt) ---
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(pw, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

// --- Signed session token (HMAC over the client id) ---
export function signSession(clientId: string): string {
  const sig = createHmac("sha256", secret()).update(clientId).digest("hex");
  return `${clientId}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const id = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expect = createHmac("sha256", secret()).update(id).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length === b.length && timingSafeEqual(a, b)) return id;
  } catch {
    /* fallthrough */
  }
  return null;
}

export function clientIdFromRequest(req: NextRequest): string | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

// --- Admin session (separate cookie; credentials live in the `admins` table) ---
export function signAdmin(): string {
  const sig = createHmac("sha256", secret()).update("admin").digest("hex");
  return `admin.${sig}`;
}

export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expect = signAdmin();
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expect);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
