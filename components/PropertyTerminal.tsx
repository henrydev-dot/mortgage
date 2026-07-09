"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { properties, type Property } from "@/lib/properties";
import Reveal from "./Reveal";

const ROW_GRID =
  "grid grid-cols-[52px_1fr_52px_20px] items-center gap-2.5 md:grid-cols-[88px_1.5fr_170px_90px_1fr_110px_44px] md:gap-4";

function StatusCell({ status }: { status: Property["status"] }) {
  if (status === "MINTING") {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-navy">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-coral" />
        MINTING
      </span>
    );
  }
  if (status === "SOLD OUT") {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-ledger">
        <span className="h-1.5 w-1.5 rounded-full bg-ledger/60" />
        SOLD OUT
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-compass">
      <span className="h-1.5 w-1.5 rounded-full bg-compass" />
      SECONDARY
    </span>
  );
}

function PropertyRow({
  property: p,
  open,
  onToggle,
}: {
  property: Property;
  open: boolean;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className={`border-b border-grid transition-colors duration-200 last:border-b-0 ${
        open ? "bg-fog" : "hover:bg-fog"
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={`${ROW_GRID} relative w-full px-4 py-4 text-left md:px-6`}
      >
        {/* Active rail */}
        <span
          className={`absolute inset-y-0 left-0 w-[2px] bg-compass transition-transform duration-200 ${
            open ? "scale-y-100" : "scale-y-0"
          }`}
        />

        <span className="font-mono text-[11px] text-ledger">{p.id}</span>

        <span className="flex items-baseline gap-2 overflow-hidden">
          <span className="truncate font-display text-lg text-navy md:text-xl">
            {p.city}
          </span>
          <span className="font-mono text-[11px] text-compass">{p.ticker}</span>
          {p.flagship && (
            <span className="hidden rounded border border-compass/40 px-1.5 py-0.5 font-mono text-[8px] tracking-eyebrow text-compass lg:inline">
              FLAGSHIP
            </span>
          )}
        </span>

        <span className="hidden md:block">
          <StatusCell status={p.status} />
        </span>

        <span className="text-right font-mono text-sm text-navy md:text-left">
          {p.apy.toFixed(1)}%
        </span>

        <span className="hidden items-center gap-3 md:flex">
          <span className="h-px flex-1 bg-grid">
            <span
              className="block h-px bg-compass"
              style={{ width: `${p.funded}%` }}
            />
          </span>
          <span className="w-9 shrink-0 font-mono text-[11px] text-ledger">
            {p.funded}%
          </span>
        </span>

        <span className="hidden font-mono text-[12px] text-navy md:block">
          {p.priceUsdc} <span className="text-ledger">USDC</span>
        </span>

        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`justify-self-end text-ledger transition-transform duration-300 ${
            open ? "rotate-180 text-compass" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 border-t border-grid px-4 py-6 md:grid-cols-[1.4fr_1fr] md:px-6">
              <div>
                <p className="font-mono text-[10px] tracking-eyebrow text-ledger">
                  {p.coordinates} · {p.country.toUpperCase()}
                </p>
                <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-navy">
                  {p.description}
                </p>
                <div className="mt-4 md:hidden">
                  <StatusCell status={p.status} />
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4 md:items-end">
                <div className="grid grid-cols-3 gap-6 font-mono text-[11px] md:text-right">
                  <div>
                    <p className="text-[9px] tracking-eyebrow text-ledger">PRICE</p>
                    <p className="mt-1 text-sm text-navy">{p.priceUsdc}</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-eyebrow text-ledger">APY</p>
                    <p className="mt-1 text-sm text-navy">{p.apy.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-eyebrow text-ledger">FUNDED</p>
                    <p className="mt-1 text-sm text-navy">{p.funded}%</p>
                  </div>
                </div>
                <a href="#" className="arrow-link">
                  View Property
                  <ArrowRight size={14} strokeWidth={1.75} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PropertyTerminal() {
  const [openId, setOpenId] = useState<string | null>(properties[0].id);

  return (
    <section id="properties" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-line">
        <Reveal>
          <p className="eyebrow mb-4">PROPERTY_INDEX · LIVE ON BASE</p>
        </Reveal>
        <Reveal index={1}>
          <div className="flex flex-wrap items-end justify-between gap-6 pb-12">
            <h2 className="font-display text-4xl tracking-tight text-navy md:text-5xl">
              Three cities. One ledger.
            </h2>
            <p className="max-w-sm font-sans text-sm leading-relaxed text-ledger">
              Every asset is a regulated SPV mirrored onchain. Open a row to
              inspect the deed.
            </p>
          </div>
        </Reveal>

        <Reveal index={2}>
          <div className="overflow-hidden rounded border border-grid bg-paper">
            {/* Terminal title bar */}
            <div className="flex items-center justify-between bg-navy px-4 py-2.5 md:px-6">
              <span className="font-mono text-[10px] tracking-eyebrow text-paper/60">
                MRT://PROPERTY-INDEX
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-eyebrow text-paper/60">
                <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
                {properties.length} ASSETS · LIVE
              </span>
            </div>

            {/* Column headers */}
            <div
              className={`${ROW_GRID} border-b border-grid bg-fog px-4 py-2.5 font-mono text-[9px] tracking-eyebrow text-ledger md:px-6`}
            >
              <span>ID</span>
              <span>ASSET</span>
              <span className="hidden md:block">STATUS</span>
              <span className="text-right md:text-left">APY</span>
              <span className="hidden md:block">FUNDED</span>
              <span className="hidden md:block">PRICE</span>
              <span />
            </div>

            {properties.map((p) => (
              <PropertyRow
                key={p.id}
                property={p}
                open={openId === p.id}
                onToggle={() => setOpenId(openId === p.id ? null : p.id)}
              />
            ))}
          </div>
        </Reveal>

        <Reveal index={3}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[10px] tracking-wider text-ledger">
              DATA REFRESHED EVERY BLOCK · CHAIN 8453
            </p>
            <a href="#" className="arrow-link">
              Open full explorer
              <ArrowUpRight size={14} strokeWidth={1.75} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
