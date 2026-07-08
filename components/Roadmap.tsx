"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
import { roadmap } from "@/lib/roadmap";
import Reveal from "./Reveal";

export default function Roadmap() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // GSAP owns scroll-scrubbed choreography: the timeline's progress line
  // draws itself as the section moves through the viewport.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (lineRef.current) lineRef.current.style.transform = "scaleX(1)";
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "bottom 75%",
            scrub: 0.6,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Fraction of the line covered by completed quarters, up to the current marker
  const currentIndex = roadmap.findIndex((r) => r.current);
  const hereAt = ((currentIndex + 0.5) / roadmap.length) * 100;

  return (
    <section id="roadmap" ref={sectionRef} className="scroll-mt-16 border-t border-grid bg-fog py-24 md:py-32">
      <div className="container-line">
        <Reveal>
          <p className="eyebrow mb-4">PROTOCOL TIMELINE</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="font-display text-4xl tracking-tight text-navy md:text-5xl">
            Roadmap
          </h2>
        </Reveal>

        <div className="relative mt-16">
          {/* Base hairline + scrubbed compass progress line (desktop) */}
          <div className="absolute left-0 right-0 top-[7px] hidden h-px bg-grid lg:block">
            <div
              ref={lineRef}
              className="h-px origin-left bg-compass"
              style={{ transform: "scaleX(0)" }}
            />
            {/* You-are-here marker */}
            <span
              className="absolute -top-[5px] flex h-[11px] w-[11px] -translate-x-1/2 items-center justify-center"
              style={{ left: `${hereAt}%` }}
            >
              <span className="pulse-dot h-[9px] w-[9px] rounded-full border border-coral bg-fog" />
              <span className="absolute h-[3px] w-[3px] rounded-full bg-coral" />
            </span>
          </div>

          <ol className="grid gap-10 lg:grid-cols-5 lg:gap-6">
            {roadmap.map((item, i) => (
              <Reveal key={item.quarter} index={i}>
                <li className="relative border-l border-grid pl-5 lg:border-l-0 lg:pl-0">
                  {/* Node on the desktop line */}
                  <span
                    className={`mb-6 hidden h-[15px] w-[15px] items-center justify-center rounded-full border lg:flex ${
                      item.done
                        ? "border-compass bg-compass text-paper"
                        : item.current
                          ? "border-coral bg-fog"
                          : "border-grid bg-fog"
                    }`}
                  >
                    {item.done && <Check size={9} strokeWidth={3} />}
                  </span>

                  <p className="flex items-center gap-2 font-mono text-xs tracking-eyebrow text-compass">
                    {item.quarter}
                    {item.current && (
                      <span className="rounded border border-coral/50 px-1.5 py-0.5 text-[9px] text-coral">
                        YOU ARE HERE
                      </span>
                    )}
                  </p>
                  <h3 className="mt-2 font-display text-lg text-navy">
                    {item.title}
                  </h3>
                  <ul className="mt-3 space-y-1.5">
                    {item.points.map((pt) => (
                      <li key={pt} className="font-sans text-[13px] leading-relaxed text-ledger">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
