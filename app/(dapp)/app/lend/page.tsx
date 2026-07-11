import type { Metadata } from "next";
import PageHeader, { StatBlock } from "@/components/dapp/PageHeader";
import LendClient from "@/components/dapp/LendClient";
import { lendMarkets } from "@/lib/appSeed";

export const metadata: Metadata = { title: "Lend & Borrow" };

export default function LendPage() {
  const minApr = Math.min(...lendMarkets.map((m) => m.aprPct));
  const maxLtv = Math.max(...lendMarkets.map((m) => m.maxLtv));

  return (
    <>
      <PageHeader
        eyebrow="LEND & BORROW · COLLATERALIZED USDT LOANS"
        title="Borrow."
        sub="Post ETH, cbBTC, wSOL and other Base-network assets as collateral and draw USDT at a fixed rate. Repay monthly or in one payment at maturity."
      >
        <StatBlock value={`FROM ${minApr.toFixed(1)}%`} label="BORROW APR" />
        <StatBlock value={`UP TO ${Math.round(maxLtv * 100)}%`} label="MAX LTV" />
        <StatBlock value={String(lendMarkets.length)} label="COLLATERAL ASSETS" />
      </PageHeader>
      <LendClient markets={lendMarkets} />
    </>
  );
}
