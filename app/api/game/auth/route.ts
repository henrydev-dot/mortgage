import { NextResponse } from "next/server";
import { isAddress, verifyMessage } from "viem";
import { LOGIN_MESSAGE } from "@/lib/game/config";
import { ensurePlayer, loadGame, saveGame, tick } from "@/lib/game/engine";
import { GAME_COOKIE, signGameSession } from "@/lib/game/session";

export const dynamic = "force-dynamic";

/** POST { address, signature } — wallet-signed game login. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = String(body.address || "");
    const signature = String(body.signature || "");
    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid address." }, { status: 400 });
    }
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message: LOGIN_MESSAGE(address),
      signature: signature as `0x${string}`,
    }).catch(() => false);
    if (!valid) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

    const state = await loadGame();
    tick(state);
    ensurePlayer(state, address);
    await saveGame(state);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(GAME_COOKIE, signGameSession(address), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (error) {
    console.error("Game auth error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GAME_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
