"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import PixelGrid from "./PixelGrid";
import { properties } from "@/lib/properties";

export default function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Floating data card parallax — max ±7px, spring-smoothed
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cardX = useSpring(mx, { stiffness: 60, damping: 18 });
  const cardY = useSpring(my, { stiffness: 60, damping: 18 });

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 14);
  };

  const monaco = properties[0];

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      className="relative flex min-h-screen items-center overflow-hidden pt-16"
    >
      <PixelGrid className="absolute inset-0 h-full w-full" />

      {/* Single allowed gradient: subtle compass radial glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] top-[30%] h-[520px] w-[720px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(39,92,171,0.06), transparent)",
        }}
      />

      <div className="container-line relative z-10 grid items-center gap-16 py-24 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="eyebrow mb-6 flex items-center gap-2.5 !text-navy"
          >
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-coral" />
            LIVE ON BASE
          </motion.p>

          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="font-display text-[56px] leading-[0.98] tracking-tight text-navy sm:text-[76px] lg:text-[96px]"
          >
            Real estate,
            <br />
            <span className="font-bold text-compass">tokenized.</span>
          </motion.h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mt-7 max-w-md font-sans text-lg leading-relaxed text-ledger"
          >
            Own a fraction of the world&apos;s most desirable addresses —
            verified, custodied, and settled on Base.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a href="#properties" className="btn-primary">
              Explore Properties
              <ArrowRight size={16} strokeWidth={1.75} />
            </a>
            <Link href="/lightpaper" className="btn-ghost">
              Read the Lightpaper
            </Link>
          </motion.div>
        </div>

        {/* Floating property data card */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{ x: cardX, y: cardY }}
          className="mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end"
        >
          <div className="rounded border border-grid bg-paper">
            {/* Generative visual field */}
            <div className="relative aspect-[16/10] overflow-hidden border-b border-grid bg-navy">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <img
                src="/brand/mark.svg"
                alt=""
                aria-hidden
                className="absolute -right-8 -top-8 h-44 w-44 opacity-25"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <div className="absolute bottom-4 left-4">
                <p className="font-mono text-[10px] tracking-eyebrow text-paper/60">
                  {monaco.coordinates}
                </p>
                <p className="mt-1 font-display text-2xl text-paper">
                  Monaco <span className="font-mono text-sm text-paper/60">{monaco.ticker}</span>
                </p>
              </div>
              <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded border border-coral/40 bg-navy/60 px-2 py-1 font-mono text-[10px] tracking-eyebrow text-coral">
                <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
                MINTING
              </span>
              <span className="absolute left-3 top-3 rounded border border-paper/20 px-2 py-1 font-mono text-[10px] tracking-eyebrow text-paper/70">
                {monaco.id}
              </span>
            </div>

            <div className="space-y-3 p-5">
              <div className="flex items-baseline justify-between font-mono text-sm text-navy">
                <span>{monaco.apy.toFixed(1)}% APY</span>
                <span className="text-ledger">{monaco.funded}% funded</span>
              </div>
              <div className="h-px w-full bg-grid">
                <div
                  className="h-px bg-compass"
                  style={{ width: `${monaco.funded}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-xs text-ledger">
                  {monaco.priceUsdc} USDC / fraction
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] tracking-eyebrow text-compass">
                  <ShieldCheck size={12} strokeWidth={1.5} />
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
