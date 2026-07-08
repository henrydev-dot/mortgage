"use client";

import { useRef, useState } from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";
import { partners } from "@/lib/partners";
import Reveal from "./Reveal";

/** Base's basemark: a plain blue square. */
function Basemark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" fill="#0052FF" />
    </svg>
  );
}

const MARQUEE_SPEED = 40; // px per second, constant

function Marquee() {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const [paused, setPaused] = useState(false);

  useAnimationFrame((_, delta) => {
    if (reduced || paused) return;
    const track = trackRef.current;
    if (!track) return;
    offset.current -= (MARQUEE_SPEED * delta) / 1000;
    // Track holds two copies of the logo set; wrap at half its width
    const half = track.scrollWidth / 2;
    if (half > 0 && -offset.current >= half) offset.current += half;
    track.style.transform = `translateX(${offset.current}px)`;
  });

  // Reduced motion: static wrapped row instead of auto-playing marquee
  if (reduced) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        {partners.map((p) => (
          <img
            key={p.name}
            src={p.logo}
            alt={p.name}
            className="h-6 w-auto text-ledger"
            title={p.name}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div ref={trackRef} className="flex w-max items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {partners.map((p) => (
              <span
                key={`${copy}-${p.name}`}
                className="group relative mx-10 inline-flex shrink-0 items-center py-2 text-ledger transition-colors duration-300 hover:text-navy"
              >
                {/* currentColor SVGs: gray at rest, navy on hover */}
                <span
                  className="block h-6 w-auto"
                  style={{
                    WebkitMaskImage: `url(${p.logo})`,
                    maskImage: `url(${p.logo})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    backgroundColor: "currentColor",
                    aspectRatio: "auto",
                    width: "110px",
                    height: "26px",
                  }}
                  role="img"
                  aria-label={p.name}
                />
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-compass shadow-[0_0_6px_rgba(39,92,171,0.6)] transition-transform duration-300 group-hover:scale-x-100" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EcosystemStrip() {
  return (
    <section className="border-y border-grid bg-fog py-16">
      <div className="container-line flex flex-col items-center gap-12">
        {/* Tier 1 — the chain we're built on */}
        <Reveal>
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-lg border border-grid bg-paper px-6 py-3.5 transition-colors duration-200 hover:border-compass"
          >
            <Basemark size={22} />
            <span className="font-sans text-sm font-medium text-navy">
              Built on <span className="font-semibold">Base</span>
            </span>
            <span className="ml-1 border-l border-grid pl-3 font-mono text-[10px] tracking-eyebrow text-ledger">
              COINBASE L2
            </span>
          </a>
        </Reveal>

        {/* Tier 2 — infrastructure partners */}
        <div className="w-full">
          <Reveal index={1}>
            <p className="eyebrow mb-8 text-center">
              SECURED BY LEADING INFRASTRUCTURE
            </p>
          </Reveal>
          <Reveal index={2}>
            <Marquee />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
