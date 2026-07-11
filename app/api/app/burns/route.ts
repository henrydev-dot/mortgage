import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { seedBurns, type BurnEvent } from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const burns = await readCollection<BurnEvent>("burns", seedBurns);
  return NextResponse.json({ burns });
}

/** Admin: replace the buyback & burn history. */
export async function PUT(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!Array.isArray(body.burns)) {
    return NextResponse.json({ error: "burns must be an array" }, { status: 400 });
  }
  await writeCollection("burns", body.burns);
  return NextResponse.json({ ok: true, count: body.burns.length });
}
