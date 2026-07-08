import type { Metadata } from "next";
import PaperViewer from "@/components/PaperViewer";

export const metadata: Metadata = {
  title: "Lightpaper — Mortgage Estate",
  description: "The 10-minute overview of the Mortgage Estate protocol.",
};

export default function LightpaperPage() {
  return (
    <PaperViewer
      title="Lightpaper"
      meta="12 PAGES · PDF · UPDATED JUL 2026"
      file="/docs/mortgage-estate-lightpaper.pdf"
    />
  );
}
