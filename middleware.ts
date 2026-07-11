import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. Admin gate: when ADMIN_KEY is set, /admin pages require the
 *    session cookie issued by /api/admin/login (sha256 of the key).
 * 2. Subdomain routing: app.b20mortgage.com serves the dapp from the
 *    domain root — "/" and section paths rewrite to /app/*; /admin and
 *    /api pass through so the panel and APIs work on the subdomain too.
 */

const ADMIN_COOKIE = "mrt_admin";

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- admin gate (any host) ----
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const key = process.env.ADMIN_KEY;
    if (key) {
      const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
      if (cookie !== (await sha256Hex(key))) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.search = `?next=${encodeURIComponent(pathname)}`;
        return NextResponse.redirect(url);
      }
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
