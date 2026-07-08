"use client";

import { useRef } from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";
import { properties } from "@/lib/properties";

const SPEED = 50; // px per second

/** Exchange-style data ticker pinned to the bottom edge of the hero. */
export default function HeroTicker() {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;
    offset.current -= (SPEED * delta) / 1000;
    const half = track.scrollWidth / 2;
    if (half > 0 && -offset.current >= half) offset.current += half;
    track.style.transform = `translateX(${offset.current}px)`;
  });

  const items = [
    ...properties.map(
      (p) => `${p.ticker} ${p.apy.toFixed(1)}% APY · ${p.funded}% FUNDED`
    ),
    "TVL $84.2M",
    "INVESTORS 12,400+",
    "NEXT MINT Q3 2026",
  ];

  return (
    <div className="relative z-10 overflow-hidden border-t border-grid bg-paper/70 backdrop-blur-sm">
      <div ref={trackRef} className="flex w-max items-center py-2.5">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {items.map((item, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex items-center whitespace-nowrap font-mono text-[11px] tracking-wider text-navy/80"
              >
                <span className="mx-5 text-compass">▲</span>
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
