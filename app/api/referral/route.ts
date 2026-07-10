import { NextResponse } from "next/server";
import { AIRDROP, isValidAddress, referralLink } from "@/lib/airdrop";
import {
  loadApplications,
  loadReferralRegs,
  referralCount,
  saveReferralRegs,
} from "@/lib/airdropStore";

export const dynamic = "force-dynamic";

/**
 * Referral-link registry.
 * POST { address } → records that this wallet generated its link
 *                    (referral-links.json) and returns the link plus
 *                    live referral stats.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = String(body.address || "").trim();
    if (!isValidAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    const key = address.toLowerCase();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    const regs = loadReferralRegs();
    if (regs[key]) {
      regs[key].hits += 1;
    } else {
      regs[key] = { address, ts: new Date().toISOString(), ip, hits: 1 };
    }
    saveReferralRegs(regs);

    const apps = loadApplications();
    const referrals = referralCount(apps, address);

    return NextResponse.json({
      ok: true,
      link: referralLink(address),
      referrals,
      referralEarned: referrals * AIRDROP.referralBonus,
      applied: Boolean(apps[key]),
    });
  } catch (error) {
    console.error("Referral registry error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
