/**
 * Minimal admin guard for write endpoints. Set ADMIN_KEY in the env and
 * send it as the `x-admin-key` header. If ADMIN_KEY is unset (dev),
 * requests are allowed — same open posture as the existing /admin pages.
 */
export function checkAdminKey(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  return request.headers.get("x-admin-key") === key;
}
