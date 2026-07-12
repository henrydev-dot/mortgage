import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { loadGame, saveGame, tick } from "@/lib/game/engine";

export const dynamic = "force-dynamic";

function guard(request: Request) {
  return checkAdminKey(request)
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Full state dump for the admin panel. */
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const state = await loadGame();
  tick(state);
  await saveGame(state);
  return NextResponse.json({
    players: Object.values(state.players),
    withdrawals: state.withdrawals,
    heat: state.heat,
    lots: state.lots,
    depositCount: Object.keys(state.deposits).length,
  });
}

/**
 * PUT — admin mutations:
 *  { op: "set_balance", address, balance }
 *  { op: "withdrawal", id, status: "paid" | "rejected" }  (rejected refunds)
 *  { op: "reset_lot", tileId }  (returns a lot to the bank)
 */
export async function PUT(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const body = await request.json();
  const state = await loadGame();
  tick(state);

  if (body.op === "set_balance") {
    const player = state.players[String(body.address || "").toLowerCase()];
    if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    const balance = Math.max(0, Math.floor(Number(body.balance)));
    if (!Number.isFinite(balance)) return NextResponse.json({ error: "Bad balance." }, { status: 400 });
    player.balance = balance;
  } else if (body.op === "withdrawal") {
    const wd = state.withdrawals.find((w) => w.id === body.id);
    if (!wd) return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
    const status = body.status === "paid" ? "paid" : "rejected";
    if (wd.status !== "pending") {
      return NextResponse.json({ error: "Already processed." }, { status: 400 });
    }
    wd.status = status;
    if (status === "rejected") {
      const player = state.players[wd.address];
      if (player) {
        player.balance += wd.amount;
        player.withdrawn -= wd.amount;
      }
    }
  } else if (body.op === "reset_lot") {
    const lot = state.lots.find((l) => l.id === Number(body.tileId));
    if (!lot) return NextResponse.json({ error: "Lot not found." }, { status: 404 });
    lot.owner = null;
    lot.nightly = null;
    lot.salePrice = null;
    lot.tier = 0;
    lot.condition = 100;
  } else {
    return NextResponse.json({ error: "Unknown op." }, { status: 400 });
  }

  await saveGame(state);
  return NextResponse.json({ ok: true });
}
