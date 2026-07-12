import { NextResponse } from "next/server";
import { applyAction, loadGame, saveGame, tick, type GameAction } from "@/lib/game/engine";
import { verifyGameSession } from "@/lib/game/session";

export const dynamic = "force-dynamic";

/** POST — a signed-in player's game action. */
export async function POST(request: Request) {
  const address = verifyGameSession(request);
  if (!address) {
    return NextResponse.json({ error: "Sign in with your wallet first." }, { status: 401 });
  }
  try {
    const action = (await request.json()) as GameAction;
    const state = await loadGame();
    tick(state);
    const result = applyAction(state, address, action);
    if (!result.ok) {
      await saveGame(state); // tick may still have settled income
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await saveGame(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Game action error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
