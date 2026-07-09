import { Download, FileText } from "lucide-react";
import Reveal from "./Reveal";

const papers = [
  {
    slug: "lightpaper",
    title: "Lightpaper",
    subtitle: "The 10-minute overview.",
    meta: "12 PAGES · PDF · UPDATED JUL 2026",
    file: "/docs/mortgage-estate-lightpaper.pdf",
    lines: 5,
  },
  {
    slug: "whitepaper",
    title: "Whitepaper",
    subtitle: "The full technical & legal framework.",
    meta: "64 PAGES · PDF · UPDATED JUL 2026",
    file: "/docs/mortgage-estate-whitepaper.pdf",
    lines: 9,
  },
];

/** Flat, technical document mock — thin strokes, no 3D book. */
function DocIllustration({ lines }: { lines: number }) {
  return (
    <div className="relative h-32 w-24 rounded border border-grid bg-paper p-3 transition-colors duration-300 group-hover:border-compass/60">
      <FileText
        size={16}
        strokeWidth={1.25}
        className="mb-2.5 text-compass"
        aria-hidden
      />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-1.5 h-px bg-grid"
          style={{ width: `${100 - (i % 3) * 22}%` }}
        />
      ))}
      <span className="absolute bottom-2 right-2 font-mono text-[8px] tracking-eyebrow text-ledger">
        PDF
      </span>
    </div>
  );
}

export default function PapersSection() {
  return (
    <section id="papers" className="scroll-mt-16 border-t border-grid bg-fog py-24 md:py-32">
      <div className="container-line">
        <Reveal>
          <p className="eyebrow mb-4">DOCUMENTATION</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="max-w-xl font-display text-4xl tracking-tight text-navy md:text-5xl">
            Read the protocol, not the pitch.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {papers.map((paper, i) => (
            <Reveal key={paper.slug} index={i}>
              <div className="group flex h-full flex-col gap-8 rounded border border-grid bg-paper p-8 transition-colors duration-300 hover:border-compass/60 sm:flex-row">
                <DocIllustration lines={paper.lines} />
                <div className="flex flex-1 flex-col">
                  <h3 className="font-display text-2xl text-navy">{paper.title}</h3>
                  <p className="mt-1.5 font-sans text-sm text-ledger">
                    {paper.subtitle}
                  </p>
                  <p className="mt-4 font-mono text-[11px] tracking-wider text-ledger">
                    {paper.meta}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    <span
                      className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-ledger/50 cursor-not-allowed select-none"
                      title="Not published yet"
                    >
                      <Download size={14} strokeWidth={1.75} />
                      Download PDF
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
