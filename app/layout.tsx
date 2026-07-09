import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://b20mortgage.com"),
  title: "Mortgage Estate — Real estate, tokenized on Base",
  description:
    "Own a fraction of the world's most desirable addresses — verified, custodied, and settled on Base. Fractional real-estate tokens with onchain yield.",
  keywords: [
    "real estate tokenization",
    "RWA",
    "Base",
    "fractional ownership",
    "onchain real estate",
  ],
  openGraph: {
    title: "Mortgage Estate — Real estate, tokenized.",
    description:
      "Own a fraction of the world's most desirable addresses — verified, custodied, and settled on Base.",
    type: "website",
    images: ["/brand/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mortgage Estate — Real estate, tokenized.",
    description:
      "Fractional real-estate tokens with onchain yield, settled on Base.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
