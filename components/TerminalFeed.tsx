"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { properties } from "@/lib/properties";
import { useBlockNumber } from "./useBlockNumber";

type EventKind = "MINT" | "TRADE" | "YIELD" | "VERIFY";

interface FeedEvent {
  id: number;
  time: string;
  kind: EventKind;
  line: string;
}

/** Light, on-brand chips — readable against the paper window body. */
const KIND_CHIP: Record<EventKind, string> = {
  MINT: "bg-compass/10 text-compass",
  TRADE: "bg-navy/[0.06] text-navy",
  VERIFY: "border border-compass/30 text-compass",
  YIELD: "bg-ledger/15 text-navy/70",
};

let eventId = 0;

function randomHex(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  return s;
}

function makeEvent(date: Date, forceKind?: EventKind): FeedEvent {
  const p = properties[Math.floor(Math.random() * properties.length)];
  const roll = Math.random();
  const kind: EventKind =
    forceKind ??
    (roll < 0.42 ? "MINT" : roll < 0.74 ? "TRADE" : roll < 0.9 ? "VERIFY" : "YIELD");
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
 * Live protocol feed styled as a light macOS app window — 16:9,
 * traffic-light dots, paper/fog chrome, compass-mark pattern behind
 * the event stream.
 */
export default function TerminalFeed() {
  const reduced = useReducedMotion();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const block = useBlockNumber();
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Seed the window so it never starts empty — with guaranteed variety
    const now = Date.now();
    const seedKinds: EventKind[] = ["TRADE", "MINT", "VERIFY", "TRADE", "YIELD", "MINT"];
    setEvents(
      seedKinds.map((kind, i) =>
        makeEvent(new Date(now - (seedKinds.length - i) * 2400), kind)
      )
    );
    if (reduced) return;

    const tick = () => {
      setEvents((prev) => [...prev.slice(-7), makeEvent(new Date())]);
      timeout.current = setTimeout(tick, 1500 + Math.random() * 1700);
    };
    timeout.current = setTimeout(tick, 1200);
    return () => clearTimeout(timeout.current);
  }, [reduced]);

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_24px_70px_-36px_rgba(29,37,84,0.35)] md:aspect-video">
      {/* Window chrome — macOS title bar in brand hues */}
      <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
        <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger">
          MRT://LIVE_FEED
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-compass">
          <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
          BASE MAINNET
        </span>
      </div>

      {/* Summary cells */}
      <div className="grid grid-cols-3 divide-x divide-grid border-b border-grid">
        {[
          ["TVL", "$84.2M"],
          ["BLENDED APY", "4.3%"],
          ["ASSETS", "8 CITIES"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 overflow-hidden px-4 py-3">
            <p className="truncate font-mono text-[9px] tracking-eyebrow text-ledger">
              {label}
            </p>
            <p className="mt-1 font-mono text-[15px] text-navy">{value}</p>
          </div>
        ))}
      </div>

      {/* Event stream */}
      <div className="relative h-[236px] flex-1 overflow-hidden px-3 py-3 md:h-auto">
        {/* The compass mark as a repeating background pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.045]"
          style={{
            WebkitMaskImage: "url(/brand/mark.svg)",
            maskImage: "url(/brand/mark.svg)",
            WebkitMaskRepeat: "repeat",
            maskRepeat: "repeat",
            WebkitMaskSize: "56px 56px",
            maskSize: "56px 56px",
            backgroundColor: "var(--compass-blue)",
          }}
        />

        <div className="relative flex h-full flex-col justify-end">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.div
                key={e.id}
                initial={
                  reduced
                    ? false
                    : {
                        opacity: 0,
                        y: 10,
                        backgroundColor: "rgba(39,92,171,0.08)",
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  backgroundColor: "rgba(39,92,171,0)",
                }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex items-center gap-2.5 rounded px-1.5 py-[4px]"
              >
                <span className="w-[52px] shrink-0 font-mono text-[10px] text-ledger">
                  {e.time}
                </span>
                <span
                  className={`w-[52px] shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[9px] tracking-wider ${KIND_CHIP[e.kind]}`}
                >
                  {e.kind}
                </span>
                <span className="min-w-0 truncate font-mono text-[11px] text-navy/80">
                  {e.line}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <p className="flex items-center gap-1.5 px-1.5 py-[4px] font-mono text-[11px] text-compass">
            <span className="text-ledger">{">"}</span>
            <span className="caret-blink inline-block h-3 w-[6px] rounded-[1px] bg-compass/80" />
          </p>
        </div>

        {/* Fade the oldest lines out at the top */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-10"
          style={{ background: "linear-gradient(#ffffff, transparent)" }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-grid bg-fog px-4 py-2 font-mono text-[9px] tracking-wider text-ledger">
        <span>
          BLOCK <span className="text-navy">#{block.toLocaleString("en-US")}</span>
        </span>
        <span>GAS &lt;$0.01 · CHAIN 8453</span>
      </div>
    </div>
  );
}
