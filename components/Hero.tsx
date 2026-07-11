"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import PixelGrid from "./PixelGrid";
import DecodeText from "./DecodeText";
import TerminalFeed from "./TerminalFeed";
import HeroTicker from "./HeroTicker";

/** Thin HUD frame + mono readouts around the hero viewport — cockpit feel. */
function HudFrame() {
  const corner = "absolute h-5 w-5 border-ledger/50";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-12 top-24 hidden lg:block">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
      <p className="absolute -top-1 left-8 font-mono text-[9px] tracking-eyebrow text-ledger">
        SYS//MORTGAGE-ESTATE · RWA PROTOCOL
      </p>
      <p className="absolute -top-1 right-8 font-mono text-[9px] tracking-eyebrow text-ledger">
        CHAIN 8453 · BASE MAINNET
      </p>
      <p className="absolute -bottom-1 left-8 font-mono text-[9px] tracking-eyebrow text-ledger">
        43.7384° N, 7.4246° E — NEXT MINT
      </p>
      <p className="absolute -bottom-1 right-8 font-mono text-[9px] tracking-eyebrow text-ledger">
        EST. 2026 · AUDITED
      </p>
    </div>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();

  const enter = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay },
        };

  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden pt-16">
      <PixelGrid className="absolute inset-0 h-full w-full" />

      {/* Readability shields: calm the grid behind the header and the copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: "linear-gradient(rgba(255,255,255,0.9), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[58%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 60%, transparent 100%)",
        }}
      />

      {/* Single allowed gradient: subtle compass radial glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[28%] h-[520px] w-[760px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(39,92,171,0.07), transparent)",
        }}
      />

      <HudFrame />

      <div className="container-line relative z-10 grid flex-1 items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="min-w-0">
          <motion.p {...enter(0)} className="eyebrow mb-6 flex items-center gap-2.5 !text-navy">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-coral" />
            LIVE ON BASE
          </motion.p>

          <motion.h1
            {...enter(0.06)}
            className="font-display text-[52px] leading-[0.98] tracking-tight text-navy sm:text-[72px] xl:text-[92px]"
          >
            Real estate,
            <br />
            <DecodeText
              text="tokenized."
              className="font-bold text-compass"
              startDelay={500}
            />
          </motion.h1>

          <motion.p
            {...enter(0.12)}
            className="mt-7 max-w-md font-sans text-lg leading-relaxed text-ledger"
          >
            Own a fraction of the world&apos;s most desirable addresses —
            verified, custodied, and settled on Base.
          </motion.p>

          <motion.div {...enter(0.18)} className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/app" className="btn-primary">
              Enter App
              <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <a href="#properties" className="btn-ghost !bg-paper">
              Explore Properties
            </a>
          </motion.div>

          {/* Airdrop teaser — small, mono, one line */}
          <motion.div {...enter(0.24)} className="mt-6">
            <Link
              href="/app/airdrop"
              className="group inline-flex items-center gap-2.5 rounded border border-grid bg-paper py-2 pl-3 pr-2.5 transition-colors duration-200 hover:border-compass"
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-coral" />
              <span className="font-mono text-[11px] tracking-eyebrow text-navy">
                AIRDROP LIVE — CLAIM 1,000 $MRT
              </span>
              <ArrowRight
                size={13}
                strokeWidth={1.75}
                className="text-compass transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>

        <motion.div
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5, delay: 0.28 },
              })}
          className="mx-auto w-full min-w-0 max-w-[560px] lg:mx-0 lg:justify-self-end"
        >
          <TerminalFeed />
        </motion.div>
      </div>

      <HeroTicker />
    </section>
  );
}
