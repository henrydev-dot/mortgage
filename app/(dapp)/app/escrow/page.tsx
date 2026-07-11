import type { Metadata } from "next";
import PageHeader, { StatBlock } from "@/components/dapp/PageHeader";
import EscrowClient from "@/components/dapp/EscrowClient";
import { seedEscrowAgents, type EscrowAgent } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Escrow" };

export default async function EscrowPage() {
  const all = await readCollection<EscrowAgent>("escrow", seedEscrowAgents);
  const agents = all.filter((a) => a.status === "approved");
  const cases = agents.reduce((s, a) => s + a.casesResolved, 0);
  const minFee = agents.length ? Math.min(...agents.map((a) => a.feePct)) : 0;

  return (
    <>
      <PageHeader
        eyebrow="ESCROW · NEUTRAL THIRD PARTIES, ONCHAIN"
        title="Escrow."
        sub="A public directory of vetted arbiters for P2P deals, OTC trades, and RWA transfers. Register your wallet to offer escrow services."
      >
        <StatBlock value={String(agents.length)} label="ACTIVE AGENTS" />
        <StatBlock value={String(cases)} label="CASES RESOLVED" />
        <StatBlock value={`FROM ${minFee.toFixed(1)}%`} label="FEES" />
      </PageHeader>
      <EscrowClient agents={agents} />
    </>
  );
}
