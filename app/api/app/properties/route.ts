import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { seedProperties, type AppProperty } from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const properties = await readCollection<AppProperty>("properties", seedProperties);
  return NextResponse.json({ properties });
}

/** Admin: replace the full property list. */
export async function PUT(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!Array.isArray(body.properties)) {
    return NextResponse.json({ error: "properties must be an array" }, { status: 400 });
  }
  await writeCollection("properties", body.properties);
  return NextResponse.json({ ok: true, count: body.properties.length });
}
