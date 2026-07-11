import { createHash } from "crypto";

/**
 * Admin auth. Two accepted credentials when ADMIN_KEY is set:
 *  - `x-admin-key` header equal to ADMIN_KEY (API clients), or
 *  - `mrt_admin` cookie equal to sha256(ADMIN_KEY), issued by
 *    /api/admin/login and checked again by the middleware for pages.
 * If ADMIN_KEY is unset (local dev), everything is open.
 */

export const ADMIN_COOKIE = "mrt_admin";

export function adminCookieValue() {
  const key = process.env.ADMIN_KEY;
  if (!key) return "";
  return createHash("sha256").update(key).digest("hex");
}

export function checkAdminKey(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  if (request.headers.get("x-admin-key") === key) return true;
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match?.[1] === adminCookieValue();
}
