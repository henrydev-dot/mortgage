import { NextResponse } from "next/server";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { BASE_CHAIN, MRT_TOKEN } from "@/lib/airdrop";
import { defaultConfig, type AppConfig } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";
import { MIN_WITHDRAW } from "@/lib/game/config";
import { loadGame, pushEvent, saveGame, tick } from "@/lib/game/engine";
import { verifyGameSession } from "@/lib/game/session";

export const dynamic = "force-dynamic";

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.AIRDROP_RPC_URL || BASE_CHAIN.rpcUrl),
});

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function treasuryAddress() {
  const [stored] = await readCollection<AppConfig>("config", [defaultConfig]);
  return (stored?.treasuryAddress || defaultConfig.treasuryAddress).toLowerCase();
}

/**
 * POST { txHash } — credit a real MRT deposit. The tx must be a
 * confirmed MRT Transfer from the signed-in wallet to the treasury.
 */
export async function POST(request: Request) {
  const address = verifyGameSession(request);
  if (!address) {
    return NextResponse.json({ error: "Sign in with your wallet first." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const txHash = String(body.txHash || "").trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "Invalid transaction hash." }, { status: 400 });
    }

    const state = await loadGame();
    tick(state);
    if (state.deposits[txHash.toLowerCase()]) {
      return NextResponse.json({ error: "Deposit already credited." }, { status: 409 });
    }

    const receipt = await publicClient
      .getTransactionReceipt({ hash: txHash as `0x${string}` })
      .catch(() => null);
    if (!receipt || receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction not found or not confirmed yet — try again in a moment." },
        { status: 400 }
      );
    }

    const treasury = await treasuryAddress();
    let credited = 0;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== MRT_TOKEN.address.toLowerCase()) continue;
      if (log.topics[0] !== TRANSFER_TOPIC || log.topics.length !== 3) continue;
      const from = `0x${log.topics[1]!.slice(26)}`.toLowerCase();
      const to = `0x${log.topics[2]!.slice(26)}`.toLowerCase();
      if (from === address.toLowerCase() && to === treasury) {
        credited += Number(formatUnits(BigInt(log.data), MRT_TOKEN.decimals));
      }
    }
    credited = Math.floor(credited);
    if (credited <= 0) {
      return NextResponse.json(
        { error: "No MRT transfer from your wallet to the treasury found in this tx." },
        { status: 400 }
      );
    }

    const player = state.players[address];
    if (!player) return NextResponse.json({ error: "Join the game first." }, { status: 400 });
    player.balance += credited;
    player.deposited += credited;
    state.deposits[txHash.toLowerCase()] = credited;
    pushEvent(
      state,
      `${address.slice(0, 6)}…${address.slice(-4)} deposited ${credited.toLocaleString("en-US")} MRT into the city`
    );
    await saveGame(state);
    return NextResponse.json({ ok: true, credited });
  } catch (error) {
    console.error("Game deposit error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/** PUT { amount } — request a withdrawal (paid manually by the team). */
export async function PUT(request: Request) {
  const address = verifyGameSession(request);
  if (!address) {
    return NextResponse.json({ error: "Sign in with your wallet first." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const amount = Math.floor(Number(body.amount));
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAW.toLocaleString("en-US")} MRT.` },
        { status: 400 }
      );
    }
    const state = await loadGame();
    tick(state);
    const player = state.players[address];
    if (!player || player.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance." }, { status: 400 });
    }
    player.balance -= amount;
    player.withdrawn += amount;
    state.withdrawals.unshift({
      id: `wd-${Date.now()}`,
      address,
      amount,
      status: "pending",
      ts: new Date().toISOString(),
    });
    pushEvent(state, `${address.slice(0, 6)}…${address.slice(-4)} requested a ${amount.toLocaleString("en-US")} MRT withdrawal`);
    await saveGame(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Game withdraw error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
