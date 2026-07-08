"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { stats, type Stat } from "@/lib/stats";

function format(value: number, stat: Stat) {
  const num = stat.decimals
    ? value.toFixed(stat.decimals)
    : Math.round(value).toLocaleString("en-US");
  return `${stat.prefix ?? ""}${num}${stat.suffix ?? ""}`;
}

function CountUp({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduced) {
      el.textContent = format(stat.value, stat);
      return;
    }
    const controls = animate(0, stat.value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v, stat);
      },
    });
    return () => controls.stop();
  }, [inView, reduced, stat]);

  return (
    <span ref={ref} className="font-mono text-4xl text-paper md:text-5xl">
      {format(0, stat)}
    </span>
  );
}

export default function StatsStrip() {
  return (
    <section className="bg-navy py-16 md:py-20">
      <div className="container-line grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border-l border-paper/15 pl-5 md:pl-6"
          >
            <CountUp stat={s} />
            <p className="mt-3 font-sans text-sm text-paper/50">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
