import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { isValidAddress } from "@/lib/airdrop";
import { seedEscrowAgents, type EscrowAgent } from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

/** GET — approved agents; with ?all=1 + admin key, every registration. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agents = await readCollection<EscrowAgent>("escrow", seedEscrowAgents);
  if (searchParams.get("all") === "1") {
    if (!checkAdminKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ agents });
  }
  return NextResponse.json({ agents: agents.filter((a) => a.status === "approved") });
}

/** POST — public registration, lands as "pending" for admin review. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const alias = String(body.alias || "").trim().slice(0, 40);
    const wallet = String(body.wallet || "").trim();
    const feePct = Number(body.feePct);
    const contact = String(body.contact || "").trim().slice(0, 80);
    const bio = String(body.bio || "").trim().slice(0, 400);
    const specialties = String(body.specialties || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!alias) return NextResponse.json({ error: "Alias is required." }, { status: 400 });
    if (!isValidAddress(wallet)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    if (!Number.isFinite(feePct) || feePct < 0 || feePct > 10) {
      return NextResponse.json({ error: "Fee must be between 0 and 10%." }, { status: 400 });
    }
    if (!contact) return NextResponse.json({ error: "Contact is required." }, { status: 400 });

    const agents = await readCollection<EscrowAgent>("escrow", seedEscrowAgents);
    if (agents.some((a) => a.wallet.toLowerCase() === wallet.toLowerCase())) {
      return NextResponse.json(
        { error: "This wallet is already registered." },
        { status: 409 }
      );
    }
    agents.push({
      id: `esc-${Date.now()}`,
      alias,
      wallet,
      feePct,
      casesResolved: 0,
      specialties,
      contact,
      bio,
      joined: new Date().toISOString().slice(0, 10),
      status: "pending",
    });
    await writeCollection("escrow", agents);
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (error) {
    console.error("Escrow registration error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/** PUT — admin: approve / reject a registration. */
export async function PUT(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const agents = await readCollection<EscrowAgent>("escrow", seedEscrowAgents);
  const agent = agents.find((a) => a.id === id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  agent.status = status as EscrowAgent["status"];
  await writeCollection("escrow", agents);
  return NextResponse.json({ ok: true });
}
