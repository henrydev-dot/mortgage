import type { Metadata } from "next";
import AirdropClient from "@/components/airdrop/AirdropClient";

const title = "Airdrop — Claim 1,000 $MRT";
const description =
  "Claim 1,000 MRT on Base. Complete four tasks, submit your wallet, and receive tokens after review — plus 200 MRT for every referred application.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/brand/mark.png", width: 1167, height: 1166 }],
  },
  twitter: { card: "summary", title, description, images: ["/brand/mark.png"] },
};

export default function AirdropPage() {
  return <AirdropClient />;
}
