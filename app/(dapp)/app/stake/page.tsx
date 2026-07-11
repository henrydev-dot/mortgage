import type { Metadata } from "next";
import PageHeader, { StatBlock } from "@/components/dapp/PageHeader";
import StakeClient from "@/components/dapp/StakeClient";
import { seedPools, type StakePool } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stake" };

export default async function StakePage() {
  const pools = await readCollection<StakePool>("pools", seedPools);
  const active = pools.filter((p) => p.active);
  const tvl = active.reduce((s, p) => s + p.tvlMrt, 0);
  const maxApr = Math.max(...active.map((p) => p.apr), 0);

  return (
    <>
      <PageHeader
        eyebrow="STAKING · EARN PROTOCOL FEES"
        title="Stake."
        sub="Two pools: single-sided MRT and MRT-USDT liquidity. Rewards come from protocol fees, not emissions."
      >
        <StatBlock value={`${(tvl / 1_000_000).toFixed(1)}M MRT`} label="TOTAL STAKED" />
        <StatBlock value={`UP TO ${maxApr.toFixed(1)}%`} label="APR" />
        <StatBlock value={String(active.length)} label="POOLS" />
      </PageHeader>
      <StakeClient pools={pools} />
    </>
  );
}
