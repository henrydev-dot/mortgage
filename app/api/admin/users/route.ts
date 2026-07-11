import { NextResponse } from "next/server";
import { checkAdminKey, hashPassword, newSalt } from "@/lib/adminAuth";
import { getAdminUsers, saveAdminUsers } from "@/lib/adminUsers";

export const dynamic = "force-dynamic";

function guard(request: Request) {
  return checkAdminKey(request)
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** List admin usernames. */
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const users = await getAdminUsers();
  return NextResponse.json({
    users: users.map((u) => ({ username: u.username, createdAt: u.createdAt })),
  });
}

/** Add a user or change an existing user's password. */
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return NextResponse.json(
      { error: "Username: 3–32 chars, letters/numbers/._- only." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const users = await getAdminUsers();
  const salt = newSalt();
  const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    existing.salt = salt;
    existing.passwordHash = hashPassword(password, salt);
  } else {
    users.push({
      username,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    });
  }
  await saveAdminUsers(users);
  return NextResponse.json({ ok: true, updated: Boolean(existing) });
}

/** Delete a user (the last one cannot be removed). */
export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const users = await getAdminUsers();
  if (users.length <= 1) {
    return NextResponse.json({ error: "Cannot delete the last admin user." }, { status: 400 });
  }
  const next = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  if (next.length === users.length) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  await saveAdminUsers(next);
  return NextResponse.json({ ok: true });
}
