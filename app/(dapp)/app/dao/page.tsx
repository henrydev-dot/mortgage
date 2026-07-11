import type { Metadata } from "next";
import PageHeader, { StatBlock } from "@/components/dapp/PageHeader";
import DaoClient from "@/components/dapp/DaoClient";
import { DAO_CONFIG } from "@/lib/appSeed";

export const metadata: Metadata = { title: "DAO" };

const fmt = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n.toLocaleString("en-US"));

export default function DaoPage() {
  return (
    <>
      <PageHeader
        eyebrow="GOVERNANCE · TOKEN-WEIGHTED VOTING"
        title="DAO."
        sub="MRT holders steer the protocol: listings, fee policy, and treasury moves. Votes are wallet-signed and weighted by your live MRT balance — no gas."
      >
        <StatBlock value={`${fmt(DAO_CONFIG.quorum)} MRT`} label="QUORUM" />
        <StatBlock value={`${fmt(DAO_CONFIG.proposalThreshold)} MRT`} label="TO PROPOSE" />
        <StatBlock value={`${DAO_CONFIG.votingDays} DAYS`} label="VOTING WINDOW" />
      </PageHeader>
      <DaoClient />
    </>
  );
}
