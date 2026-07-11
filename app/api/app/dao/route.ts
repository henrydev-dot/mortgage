import { NextResponse } from "next/server";
import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  verifyMessage,
} from "viem";
import { base } from "viem/chains";
import { BASE_CHAIN, MRT_TOKEN } from "@/lib/airdrop";
import { proposalMessage, voteMessage } from "@/lib/daoMessages";
import {
  DAO_CONFIG,
  seedProposals,
  type DaoProposal,
  type DaoVote,
} from "@/lib/appSeed";
import { readCollection, writeCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.AIRDROP_RPC_URL || BASE_CHAIN.rpcUrl),
});

/** MRT balance as a plain number; 0 if the read fails. */
async function mrtBalance(address: `0x${string}`) {
  try {
    const raw = await publicClient.readContract({
      address: MRT_TOKEN.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
    return Number(formatUnits(raw, MRT_TOKEN.decimals));
  } catch {
    return 0;
  }
}

function tally(proposal: DaoProposal, votes: DaoVote[]) {
  const mine = votes.filter((v) => v.proposalId === proposal.id);
  const forVotes = proposal.baseFor + mine.filter((v) => v.support).reduce((s, v) => s + v.weight, 0);
  const againstVotes =
    proposal.baseAgainst + mine.filter((v) => !v.support).reduce((s, v) => s + v.weight, 0);
  const ended = Date.now() > new Date(proposal.endsAt).getTime();
  const quorumMet = forVotes + againstVotes >= DAO_CONFIG.quorum;
  const status = !ended ? "ACTIVE" : quorumMet && forVotes > againstVotes ? "PASSED" : "FAILED";
  return { forVotes, againstVotes, status, voteCount: mine.length };
}

/** GET — proposals with live tallies; ?address= adds that wallet's votes. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") || "").toLowerCase();
  const proposals = await readCollection<DaoProposal>("proposals", seedProposals);
  const votes = await readCollection<DaoVote>("votes", []);
  const list = proposals
    .map((p) => ({
      ...p,
      ...tally(p, votes),
      myVote: address
        ? votes.find((v) => v.proposalId === p.id && v.address === address) ?? null
        : null,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ proposals: list, config: DAO_CONFIG });
}

/**
 * POST — signature-verified actions.
 *  { action: "vote", proposalId, support, address, signature }
 *  { action: "propose", title, summary, address, signature }
 * Vote weight = the wallet's live MRT balance read from Base.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "");
    const address = String(body.address || "");
    const signature = String(body.signature || "");

    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid address." }, { status: 400 });
    }

    if (action === "vote") {
      const proposalId = String(body.proposalId || "");
      const support = Boolean(body.support);

      const proposals = await readCollection<DaoProposal>("proposals", seedProposals);
      const proposal = proposals.find((p) => p.id === proposalId);
      if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
      if (Date.now() > new Date(proposal.endsAt).getTime()) {
        return NextResponse.json({ error: "Voting has ended." }, { status: 400 });
      }

      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message: voteMessage(proposalId, support),
        signature: signature as `0x${string}`,
      }).catch(() => false);
      if (!valid) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

      const weight = await mrtBalance(address as `0x${string}`);
      if (weight <= 0) {
        return NextResponse.json(
          { error: "No MRT in this wallet — voting power is your MRT balance." },
          { status: 400 }
        );
      }

      const votes = await readCollection<DaoVote>("votes", []);
      const key = address.toLowerCase();
      if (votes.some((v) => v.proposalId === proposalId && v.address === key)) {
        return NextResponse.json({ error: "Already voted on this proposal." }, { status: 409 });
      }
      votes.push({ proposalId, address: key, support, weight, ts: new Date().toISOString() });
      await writeCollection("votes", votes);
      return NextResponse.json({ ok: true, weight });
    }

    if (action === "propose") {
      const title = String(body.title || "").trim().slice(0, 120);
      const summary = String(body.summary || "").trim().slice(0, 1000);
      if (title.length < 8) {
        return NextResponse.json({ error: "Title too short." }, { status: 400 });
      }
      if (summary.length < 20) {
        return NextResponse.json({ error: "Summary too short." }, { status: 400 });
      }

      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message: proposalMessage(title),
        signature: signature as `0x${string}`,
      }).catch(() => false);
      if (!valid) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

      const balance = await mrtBalance(address as `0x${string}`);
      if (balance < DAO_CONFIG.proposalThreshold) {
        return NextResponse.json(
          {
            error: `Creating a proposal requires ${DAO_CONFIG.proposalThreshold.toLocaleString(
              "en-US"
            )} MRT. This wallet holds ${Math.floor(balance).toLocaleString("en-US")}.`,
          },
          { status: 403 }
        );
      }

      const proposals = await readCollection<DaoProposal>("proposals", seedProposals);
      const id = `MIP-${proposals.length + 1}`;
      const now = new Date();
      const ends = new Date(now.getTime() + DAO_CONFIG.votingDays * 24 * 60 * 60 * 1000);
      proposals.push({
        id,
        title,
        summary,
        author: address,
        createdAt: now.toISOString(),
        endsAt: ends.toISOString(),
        baseFor: 0,
        baseAgainst: 0,
      });
      await writeCollection("proposals", proposals);
      return NextResponse.json({ ok: true, id });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("DAO error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
