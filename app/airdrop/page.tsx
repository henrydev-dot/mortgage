import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";
import AirdropClient from "@/components/airdrop/AirdropClient";

export const metadata: Metadata = {
  title: "Airdrop — Claim 1,000 $MRT | Mortgage Estate",
  description:
    "Claim 1,000 MRT on Base. Complete four tasks, submit your wallet, and receive tokens automatically — plus 200 MRT for every referred claim.",
};

export default function AirdropPage() {
  return (
    <>
      <Header />
      <AirdropClient />
      <Footer />
      <Watermark />
    </>
  );
}
