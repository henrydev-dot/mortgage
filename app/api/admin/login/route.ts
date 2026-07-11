import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValue } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Small brute-force damper
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now < entry.resetAt && entry.count >= 10) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const key = process.env.ADMIN_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, open: true });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");
  await new Promise((r) => setTimeout(r, 350)); // constant-ish delay

  if (password !== key) {
    if (!entry || now > entry.resetAt) attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    else entry.count += 1;
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
