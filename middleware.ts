import { NextResponse, type NextRequest } from "next/server";

/**
 * Subdomain routing: when app.b20mortgage.com points at this deployment,
 * serve the dapp from the domain root — app.b20mortgage.com/stake is
 * rewritten to /app/stake internally. Assets, APIs, and existing /app
 * paths pass through untouched.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (!host.startsWith("app.")) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/app") ||
    pathname.startsWith("/api") ||
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
