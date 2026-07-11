import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { isValidAddress } from "@/lib/airdrop";
import type { Order } from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 20;
}

/** Admin: list reservation payments. */
export async function GET(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await readCollection<Order>("orders", []);
  return NextResponse.json({ orders });
}

/** Public: record a reservation payment after the tx is sent. */
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
    const body = await request.json();
    const propertyId = String(body.propertyId || "").trim().slice(0, 20);
    const address = String(body.address || "").trim();
    const txHash = String(body.txHash || "").trim();
    const amount = Number(body.amount);
    const currency = body.currency === "ETH" ? "ETH" : "USDT";

    if (!propertyId) return NextResponse.json({ error: "Missing property." }, { status: 400 });
    if (!isValidAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "Invalid transaction hash." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const orders = await readCollection<Order>("orders", []);
    if (orders.some((o) => o.txHash.toLowerCase() === txHash.toLowerCase())) {
      return NextResponse.json({ error: "Transaction already recorded." }, { status: 409 });
    }
    orders.push({
      id: `ord-${Date.now()}`,
      propertyId,
      address,
      txHash,
      amount,
      currency,
      ts: new Date().toISOString(),
      ip,
    });
    await writeCollection("orders", orders);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
