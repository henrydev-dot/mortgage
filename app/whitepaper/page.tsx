import type { Metadata } from "next";
import PaperViewer from "@/components/PaperViewer";

export const metadata: Metadata = {
  title: "Whitepaper — Mortgage Estate",
  description:
    "The full technical & legal framework of the Mortgage Estate protocol.",
};

export default function WhitepaperPage() {
  return (
    <PaperViewer
      title="Whitepaper"
      meta="64 PAGES · PDF · UPDATED JUL 2026"
      file="/docs/mortgage-estate-whitepaper.pdf"
    />
  );
}
