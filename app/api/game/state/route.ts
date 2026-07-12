import { NextResponse } from "next/server";
import { districtOf, lotValue } from "@/lib/game/config";
import { loadGame, netWorth, saveGame, tick } from "@/lib/game/engine";
import { verifyGameSession } from "@/lib/game/session";

export const dynamic = "force-dynamic";

/** Full public game state + the caller's player record (when signed in). */
export async function GET(request: Request) {
  const state = await loadGame();
  const before = state.lastTick;
  tick(state);
  if (state.lastTick !== before) await saveGame(state);

  const me = verifyGameSession(request);
  const player = me ? state.players[me] ?? null : null;

  const leaderboard = Object.values(state.players)
    .map((p) => ({
      address: p.address,
      netWorth: netWorth(state, p.address),
      lots: state.lots.filter((l) => l.owner === p.address).length,
    }))
    .sort((a, b) => b.netWorth - a.netWorth)
    .slice(0, 10);

  return NextResponse.json({
    lots: state.lots.map((lot) => ({
      ...lot,
      value: lotValue(
        districtOf(lot.district).baseCost,
        lot.tier,
        state.heat[lot.district] ?? 1
      ),
    })),
    heat: state.heat,
    events: state.events.slice(0, 25),
    leaderboard,
    me: player
      ? {
          ...player,
          netWorth: netWorth(state, player.address),
          pendingWithdrawals: state.withdrawals.filter(
            (w) => w.address === player.address && w.status === "pending"
          ),
        }
      : null,
    now: Date.now(),
    lastTick: state.lastTick,
  });
}
