"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity } from "lucide-react";
import { properties } from "@/lib/properties";
import { useBlockNumber } from "./useBlockNumber";

type EventKind = "MINT" | "TRADE" | "YIELD" | "VERIFY";

interface FeedEvent {
  id: number;
  time: string;
  kind: EventKind;
  line: string;
}

const KIND_STYLE: Record<EventKind, string> = {
  MINT: "text-[#8fb4ea]",
  TRADE: "text-paper/85",
  YIELD: "text-paper/60",
  VERIFY: "text-[#6ea3e8]",
};

let eventId = 0;

function randomHex(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  return s;
}

function makeEvent(date: Date): FeedEvent {
  const p = properties[Math.floor(Math.random() * properties.length)];
  const roll = Math.random();
  const kind: EventKind =
    roll < 0.42 ? "MINT" : roll < 0.74 ? "TRADE" : roll < 0.9 ? "VERIFY" : "YIELD";
  const qty = 1 + Math.floor(Math.random() * 24);
  const addr = `0x${randomHex(4)}…${randomHex(2)}`;
  const line =
    kind === "MINT"
      ? `${addr} minted ${qty} × ${p.ticker}`
      : kind === "TRADE"
        ? `${qty} × ${p.ticker} filled @ ${p.priceUsdc} USDC`
        : kind === "VERIFY"
          ? `${p.id} deed re-attested · ${p.city}`
          : `${p.ticker} yield streamed → ${qty * 38} holders`;
  const time = date.toTimeString().slice(0, 8);
  return { id: eventId++, time, kind, line };
}

/**
 * Live protocol console — the hero's centerpiece. Streams simulated
 * onchain events over a navy CRT panel with a running block counter.
 */
export default function TerminalFeed() {
  const reduced = useReducedMotion();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const block = useBlockNumber();
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Seed the panel so it never starts empty
    const now = Date.now();
    setEvents(
      Array.from({ length: 6 }, (_, i) => makeEvent(new Date(now - (6 - i) * 2400)))
    );
    if (reduced) return;

    const tick = () => {
      setEvents((prev) => [...prev.slice(-8), makeEvent(new Date())]);
      timeout.current = setTimeout(tick, 1400 + Math.random() * 1600);
    };
    timeout.current = setTimeout(tick, 1200);
    return () => clearTimeout(timeout.current);
  }, [reduced]);

  return (
    <div className="relative w-full max-w-[480px]">
      {/* HUD corner brackets */}
      <span aria-hidden className="absolute -left-2 -top-2 h-4 w-4 border-l border-t border-compass" />
      <span aria-hidden className="absolute -right-2 -top-2 h-4 w-4 border-r border-t border-compass" />
      <span aria-hidden className="absolute -bottom-2 -left-2 h-4 w-4 border-b border-l border-compass" />
      <span aria-hidden className="absolute -bottom-2 -right-2 h-4 w-4 border-b border-r border-compass" />

      <div className="overflow-hidden rounded border border-navy/20 bg-navy shadow-[0_24px_80px_-32px_rgba(29,37,84,0.45)]">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-paper/10 px-4 py-2.5">
          <span className="flex min-w-0 items-center gap-2 font-mono text-[10px] tracking-eyebrow text-paper/60">
            <Activity size={12} strokeWidth={1.5} className="shrink-0 text-[#8fb4ea]" />
            <span className="truncate">MRT://LIVE_PROTOCOL_FEED</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-eyebrow text-coral">
            <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
            BASE MAINNET
          </span>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 border-b border-paper/10 font-mono">
          {[
            ["TVL", "$84.2M"],
            ["BLENDED APY", "4.3%"],
            ["ASSETS", "8 CITIES"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 overflow-hidden border-r border-paper/10 px-4 py-3 last:border-r-0">
              <p className="truncate text-[9px] tracking-eyebrow text-paper/40">{label}</p>
              <p className="mt-1 text-sm text-paper">{value}</p>
            </div>
          ))}
        </div>

        {/* Event stream */}
        <div className="crt-scanlines relative h-[248px] overflow-hidden px-4 py-3">
          <div className="flex h-full flex-col justify-end">
            <AnimatePresence initial={false}>
              {events.map((e) => (
                <motion.p
                  key={e.id}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex gap-2.5 whitespace-nowrap py-[3px] font-mono text-[11px] leading-relaxed"
                >
                  <span className="text-paper/35">{e.time}</span>
                  <span className={`w-14 shrink-0 ${KIND_STYLE[e.kind]}`}>{e.kind}</span>
                  <span className="truncate text-paper/75">{e.line}</span>
                </motion.p>
              ))}
            </AnimatePresence>
            <p className="flex items-center gap-1 py-[3px] font-mono text-[11px] text-[#8fb4ea]">
              <span className="text-paper/35">{">"}</span>
              <span className="caret-blink inline-block h-3 w-[7px] bg-[#8fb4ea]" />
            </p>
          </div>
          {/* Fade-out at the top of the stream */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-12"
            style={{ background: "linear-gradient(rgb(29 37 84), transparent)" }}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-paper/10 px-4 py-2.5 font-mono text-[10px] tracking-wider text-paper/45">
          <span>
            BLOCK <span className="text-paper/80">#{block.toLocaleString("en-US")}</span>
          </span>
          <span>GAS &lt;$0.01 · CHAIN 8453</span>
        </div>
      </div>
    </div>
  );
}
