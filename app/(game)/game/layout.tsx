import type { Metadata } from "next";
import Web3Provider from "@/components/airdrop/Web3Provider";

export const metadata: Metadata = {
  title: "Mortgage Tycoon — Play",
  description:
    "A real-estate tycoon simulator on Base. Buy pixel properties, host Airbnb guests, ride district heat, and grow your MRT empire.",
  openGraph: {
    title: "Mortgage Tycoon",
    description:
      "Buy pixel properties, host Airbnb guests, and grow your MRT empire on Base.",
    images: [{ url: "/brand/mark.png", width: 1167, height: 1166 }],
  },
  twitter: { card: "summary", images: ["/brand/mark.png"] },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
