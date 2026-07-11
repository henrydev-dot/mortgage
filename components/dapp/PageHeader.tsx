"use client";

import type { ReactNode } from "react";
import DecodeText from "@/components/DecodeText";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: ReactNode; // right-side stats / actions
}

/**
 * Minimal dashboard page header — mono eyebrow with live dot, decode
 * title, optional stat row. No background effects; the grid stays on
 * the marketing pages.
 */
export default function PageHeader({ eyebrow, title, sub, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-grid pb-6">
      <div className="min-w-0">
        <p className="eyebrow mb-2.5 flex items-center gap-2.5 !text-navy">
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-coral" />
          {eyebrow}
        </p>
        <h1 className="font-display text-[28px] tracking-tight text-navy md:text-[34px]">
          <DecodeText text={title} startDelay={200} charDelay={40} />
        </h1>
        {sub && (
          <p className="mt-2.5 max-w-xl font-sans text-sm leading-relaxed text-ledger">
            {sub}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-6">{children}</div>}
    </div>
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
