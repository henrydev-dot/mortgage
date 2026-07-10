import { NextResponse } from "next/server";
import { AIRDROP, isValidAddress } from "@/lib/airdrop";
import {
  loadApplications,
  referralCount,
  saveApplications,
} from "@/lib/airdropStore";

export const dynamic = "force-dynamic";

/**
 * Airdrop application endpoint — records applications only.
 * Distribution is manual: review the list at /admin/airdrop (or in
 * airdrop-applications.json) and send MRT from the treasury yourself.
 *
 * POST { address, ref?, tweetUrl? } → stores a pending application
 * GET  ?address=0x…               → application status + referral count
 */

// Best-effort per-IP flood guard
const ipHits = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > IP_LIMIT;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") || "").trim();
  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const apps = loadApplications();
  const record = apps[address.toLowerCase()];
  const referrals = referralCount(apps, address);
  if (!record) return NextResponse.json({ applied: false, referrals });
  return NextResponse.json({
    applied: true,
    status: record.status,
    ts: record.ts,
    referrals,
    referralEarned: referrals * AIRDROP.referralBonus,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = String(body.address || "").trim();
    const refRaw = String(body.ref || "").trim();
    const tweetUrl = String(body.tweetUrl || "").trim().slice(0, 300);

    if (!isValidAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    const key = address.toLowerCase();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const apps = loadApplications();
    if (apps[key]) {
      return NextResponse.json(
        { error: "This wallet has already applied.", applied: true },
        { status: 409 }
      );
    }

    const ref =
      isValidAddress(refRaw) && refRaw.toLowerCase() !== key ? refRaw : undefined;

    apps[key] = {
      address,
      ts: new Date().toISOString(),
      ip,
      ref,
      tweetUrl: tweetUrl || undefined,
      status: "pending",
    };
    saveApplications(apps);

    return NextResponse.json({
      ok: true,
      status: "pending",
      amount: AIRDROP.claimAmount,
      referralRecorded: Boolean(ref),
    });
  } catch (error) {
    console.error("Airdrop application error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
