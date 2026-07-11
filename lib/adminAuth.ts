import { createHash, createHmac, randomBytes } from "crypto";

/**
 * Admin auth — classic username + password.
 *
 * Users live in the "admin-users" collection (MongoDB when configured,
 * file store otherwise). The first user is bootstrapped from the env on
 * first login: username ADMIN_USER (default "admin"), password
 * ADMIN_KEY. Manage users at /admin/users afterwards.
 *
 * Sessions: httpOnly cookie `mrt_admin` = base64url(username).hmac,
 * signed with ADMIN_KEY so the middleware can verify it without a DB
 * round-trip. API clients may alternatively send `x-admin-key`.
 * If ADMIN_KEY is unset (local dev), everything is open.
 */

export const ADMIN_COOKIE = "mrt_admin";

const secret = () => process.env.ADMIN_KEY || "";

export function newSalt() {
  return randomBytes(8).toString("hex");
}

export function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

export function signSession(username: string) {
  const sig = createHmac("sha256", secret()).update(username).digest("hex");
  return `${Buffer.from(username, "utf8").toString("base64url")}.${sig}`;
}

/** Returns the username when the session value is valid, else null. */
export function verifySession(value: string | undefined | null): string | null {
  if (!secret() || !value) return null;
  const [b64, sig] = value.split(".");
  if (!b64 || !sig) return null;
  try {
    const username = Buffer.from(b64, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret()).update(username).digest("hex");
    return sig === expected ? username : null;
  } catch {
    return null;
  }
}

function cookieFrom(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function checkAdminKey(request: Request) {
  const key = secret();
  if (!key) return true;
  if (request.headers.get("x-admin-key") === key) return true;
  return verifySession(cookieFrom(request)) !== null;
}
