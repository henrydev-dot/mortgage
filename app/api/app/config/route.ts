import { NextResponse } from "next/server";
import { checkAdminKey } from "@/lib/adminAuth";
import { defaultConfig, type AppConfig } from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stored] = await readCollection<AppConfig>("config", [defaultConfig]);
  // Prefer stored values, but fall back to defaults for anything empty —
  // so newly shipped defaults (e.g. deployed contract addresses) appear
  // even if an older config document exists.
  const config = Object.fromEntries(
    Object.entries(defaultConfig).map(([key, fallback]) => {
      const value = (stored as unknown as Record<string, unknown> | undefined)?.[key];
      return [key, value === undefined || value === "" || value === 0 ? fallback : value];
    })
  ) as unknown as AppConfig;
  return NextResponse.json({ config });
}

/** Admin: update payment + contract settings. */
export async function PUT(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const incoming = body.config ?? {};
  const config: AppConfig = {
    treasuryAddress: String(incoming.treasuryAddress || "").trim(),
    startAmountUsdt: Number(incoming.startAmountUsdt) || 0,
    startAmountEth: Number(incoming.startAmountEth) || 0,
    usdtAddress: String(incoming.usdtAddress || defaultConfig.usdtAddress).trim(),
    stakingContract: String(incoming.stakingContract || "").trim(),
    lendingContract: String(incoming.lendingContract || "").trim(),
  };
  await writeCollection("config", [config]);
  return NextResponse.json({ ok: true, config });
}
