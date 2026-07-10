import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";
import Web3Provider from "@/components/airdrop/Web3Provider";
import AirdropClient from "@/components/airdrop/AirdropClient";

const title = "Airdrop — Claim 1,000 $MRT | Mortgage Estate";
const description =
  "Claim 1,000 MRT on Base. Complete four tasks, submit your wallet, and receive tokens after review — plus 200 MRT for every referred application.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    // Square compass mark — wide lockup crops badly in link previews
    images: [{ url: "/brand/mark.png", width: 1167, height: 1166 }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/brand/mark.png"],
  },
};

export default function AirdropPage() {
  return (
    <>
      <Header />
      <Web3Provider>
        <AirdropClient />
      </Web3Provider>
      <Footer />
      <Watermark />
    </>
  );
}
