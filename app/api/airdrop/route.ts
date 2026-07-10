import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  getAddress,
  http,
  isAddress,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { AIRDROP, BASE_CHAIN, MRT_TOKEN } from "@/lib/airdrop";

export const dynamic = "force-dynamic";

/**
 * Airdrop distribution endpoint.
 *
 * POST { address, ref?, tweetUrl? }
 *   → sends 1,000 MRT to `address`, +200 MRT to `ref` (must be an
 *     earlier claimer), records the claim in claims.json.
 *
 * GET ?address=0x…
 *   → claim status + referral earnings for that wallet.
 *
 * Env:
 *   AIRDROP_PRIVATE_KEY  (required) treasury wallet private key
 *   AIRDROP_RPC_URL      (optional) defaults to Base public RPC
 */

interface ClaimRecord {
  address: string;
  ts: string;
  ip?: string;
  txHash: string;
  ref?: string;
  tweetUrl?: string;
  referrals: number;
  referralTxs: string[];
}

type ClaimsFile = Record<string, ClaimRecord>;

const CLAIMS_PATH = path.join(process.cwd(), "claims.json");

function loadClaims(): ClaimsFile {
  try {
    return JSON.parse(fs.readFileSync(CLAIMS_PATH, "utf8")) as ClaimsFile;
  } catch {
    return {};
  }
}

function saveClaims(claims: ClaimsFile) {
  fs.writeFileSync(CLAIMS_PATH, JSON.stringify(claims, null, 2), "utf8");
}

// Best-effort in-process guards (double-submit + per-IP flooding)
const inFlight = new Set<string>();
const ipHits = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT = 5;
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

function getClients() {
  const pk = process.env.AIRDROP_PRIVATE_KEY;
  if (!pk) return null;
  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`
  );
  const rpc = http(process.env.AIRDROP_RPC_URL || BASE_CHAIN.rpcUrl);
  const publicClient = createPublicClient({ chain: base, transport: rpc });
  const walletClient = createWalletClient({ account, chain: base, transport: rpc });
  return { account, publicClient, walletClient };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") || "").trim();
  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const claims = loadClaims();
  const record = claims[address.toLowerCase()];
  if (!record) return NextResponse.json({ claimed: false });
  return NextResponse.json({
    claimed: true,
    txHash: record.txHash,
    referrals: record.referrals,
    referralEarned: record.referrals * AIRDROP.referralBonus,
  });
}

export async function POST(request: Request) {
  let address = "";
  try {
    const body = await request.json();
    address = String(body.address || "").trim();
    const refRaw = String(body.ref || "").trim();
    const tweetUrl = String(body.tweetUrl || "").trim().slice(0, 300);

    if (!isAddress(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address." },
        { status: 400 }
      );
    }
    const claimer = getAddress(address);
    const key = claimer.toLowerCase();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const clients = getClients();
    if (!clients) {
      return NextResponse.json(
        { error: "Distributor not configured. Set AIRDROP_PRIVATE_KEY." },
        { status: 503 }
      );
    }
    const { account, publicClient, walletClient } = clients;

    const claims = loadClaims();
    if (claims[key]) {
      return NextResponse.json(
        { error: "This wallet has already claimed.", txHash: claims[key].txHash },
        { status: 409 }
      );
    }
    if (inFlight.has(key)) {
      return NextResponse.json(
        { error: "A claim for this wallet is already processing." },
        { status: 409 }
      );
    }
    inFlight.add(key);

    try {
      // Referrer must be an earlier claimer and not the claimer itself
      let referrer: `0x${string}` | undefined;
      if (isAddress(refRaw)) {
        const candidate = getAddress(refRaw);
        if (
          candidate.toLowerCase() !== key &&
          claims[candidate.toLowerCase()]
        ) {
          referrer = candidate;
        }
      }

      // Token decimals, with a safe fallback
      let decimals = MRT_TOKEN.decimals;
      try {
        decimals = await publicClient.readContract({
          address: MRT_TOKEN.address,
          abi: erc20Abi,
          functionName: "decimals",
        });
      } catch {
        /* keep fallback */
      }

      const nonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: "pending",
      });

      const txHash = await walletClient.writeContract({
        address: MRT_TOKEN.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [claimer, parseUnits(String(AIRDROP.claimAmount), decimals)],
        nonce,
      });

      let referralTx: `0x${string}` | undefined;
      if (referrer) {
        try {
          referralTx = await walletClient.writeContract({
            address: MRT_TOKEN.address,
            abi: erc20Abi,
            functionName: "transfer",
            args: [referrer, parseUnits(String(AIRDROP.referralBonus), decimals)],
            nonce: nonce + 1,
          });
        } catch {
          /* referral bonus failure must not fail the claim */
        }
      }

      // Persist — re-read to reduce lost updates from concurrent claims
      const latest = loadClaims();
      latest[key] = {
        address: claimer,
        ts: new Date().toISOString(),
        ip,
        txHash,
        ref: referrer,
        tweetUrl: tweetUrl || undefined,
        referrals: 0,
        referralTxs: [],
      };
      if (referrer && referralTx) {
        const refRecord = latest[referrer.toLowerCase()];
        if (refRecord) {
          refRecord.referrals += 1;
          refRecord.referralTxs.push(referralTx);
        }
      }
      saveClaims(latest);

      return NextResponse.json({
        ok: true,
        amount: AIRDROP.claimAmount,
        txHash,
        explorer: `${BASE_CHAIN.explorer}/tx/${txHash}`,
        referralCredited: Boolean(referralTx),
      });
    } finally {
      inFlight.delete(key);
    }
  } catch (error) {
    console.error("Airdrop error:", error);
    const message =
      error instanceof Error &&
      /insufficient funds|gas required exceeds|exceeds the balance/i.test(error.message)
        ? "Distributor wallet is out of gas or MRT. Please try again later."
        : "Transfer failed. Please try again later.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
