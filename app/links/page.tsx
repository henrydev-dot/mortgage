import type { Metadata } from "next";
import LinksClient from "@/components/links/LinksClient";

const title = "Links — Mortgage Estate";
const description =
  "All official Mortgage Estate links: X, Telegram, Medium, GitHub, buy $MRT on o1, token details, and support.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/brand/mark.png", width: 1167, height: 1166 }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/brand/mark.png"],
  },
};

export default function LinksPage() {
  return <LinksClient />;
}
