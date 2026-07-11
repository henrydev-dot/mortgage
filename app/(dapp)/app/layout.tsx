import type { Metadata } from "next";
import Web3Provider from "@/components/airdrop/Web3Provider";
import DappShell from "@/components/dapp/DappShell";
import ConstructionNotice from "@/components/dapp/ConstructionNotice";

export const metadata: Metadata = {
  title: {
    default: "App — Mortgage Estate",
    template: "%s — Mortgage Estate App",
  },
  description:
    "Tokenized properties, MRT staking, lend & borrow, buy & burn, escrow, and DAO governance on Base.",
  openGraph: {
    images: [{ url: "/brand/mark.png", width: 1167, height: 1166 }],
  },
  twitter: { card: "summary", images: ["/brand/mark.png"] },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <DappShell>{children}</DappShell>
      <ConstructionNotice />
    </Web3Provider>
  );
}
