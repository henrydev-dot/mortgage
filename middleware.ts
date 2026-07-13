import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. Admin gate: when ADMIN_KEY is set, /admin pages require the
 *    session cookie issued by /api/admin/login — base64url(username)
 *    dot HMAC-SHA256(username) signed with ADMIN_KEY.
 * 2. Subdomain routing: app.b20mortgage.com serves the dapp from the
 *    domain root; /admin and /api pass through untouched.
 */

const ADMIN_COOKIE = "mrt_admin";

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function decodeBase64Url(value: string) {
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    return atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  } catch {
    return null;
  }
}

async function validSession(cookie: string | undefined, secret: string) {
  if (!cookie) return false;
  const [b64, sig] = cookie.split(".");
  if (!b64 || !sig) return false;
  const username = decodeBase64Url(b64);
  if (!username) return false;
  return (await hmacHex(secret, username)) === sig;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- admin gate (any host) ----
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const key = process.env.ADMIN_KEY;
    if (key && !(await validSession(request.cookies.get(ADMIN_COOKIE)?.value, key))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  // ---- app subdomain rewrite ----
  const host = request.headers.get("host") || "";
  if (!host.startsWith("app.")) return NextResponse.next();

  if (
    pathname.startsWith("/app") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/partners") ||
    pathname.startsWith("/docs") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/app${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
