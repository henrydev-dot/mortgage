"use client";

import type { ReactNode } from "react";
import PixelGrid from "@/components/PixelGrid";
import DecodeText from "@/components/DecodeText";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: ReactNode; // right-side stats / actions
}

/**
 * Dapp page hero band — the marketing hero's DNA in compact form:
 * cursor-reactive pixel grid, mono eyebrow with live dot, decode title.
 */
export default function PageHeader({ eyebrow, title, sub, children }: PageHeaderProps) {
  return (
    <section className="relative isolate -mx-4 mb-8 overflow-hidden border-b border-grid bg-paper px-4 md:-mx-8 md:px-8">
      <PixelGrid className="absolute inset-0 z-0 h-full w-full" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full lg:w-[65%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.6) 60%, transparent 100%)",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-6 py-10 md:py-14">
        <div className="min-w-0">
          <p className="eyebrow mb-3 flex items-center gap-2.5 !text-navy">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-coral" />
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl tracking-tight text-navy md:text-[40px]">
            <DecodeText text={title} startDelay={250} charDelay={45} />
          </h1>
          {sub && (
            <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-ledger">
              {sub}
            </p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-6">{children}</div>}
      </div>
    </section>
  );
}

/** Mono stat used in page headers and dashboards. */
export function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-grid pl-4">
      <p className="font-mono text-lg text-navy md:text-xl">{value}</p>
      <p className="mt-1 font-mono text-[9px] tracking-eyebrow text-ledger">{label}</p>
    </div>
  );
}
