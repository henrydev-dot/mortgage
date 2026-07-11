import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { seedPools, type StakePool } from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const pools = await readCollection<StakePool>("pools", seedPools);
  return NextResponse.json({ pools });
}

/** Admin: replace the pool list (APR, lock, min, contract address…). */
export async function PUT(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!Array.isArray(body.pools)) {
    return NextResponse.json({ error: "pools must be an array" }, { status: 400 });
  }
  await writeCollection("pools", body.pools);
  return NextResponse.json({ ok: true, count: body.pools.length });
}
