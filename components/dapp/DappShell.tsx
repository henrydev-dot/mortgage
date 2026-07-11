"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBlockNumber } from "@/components/useBlockNumber";
import ConnectWallet from "./ConnectWallet";

const navItems = [
  { label: "Properties", href: "/app" },
  { label: "Stake", href: "/app/stake" },
  { label: "Lend", href: "/app/lend" },
  { label: "Buy & Burn", href: "/app/buyback" },
  { label: "Escrow", href: "/app/escrow" },
  { label: "DAO", href: "/app/dao" },
  { label: "Airdrop", href: "/app/airdrop" },
];

export default function DappShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const block = useBlockNumber();

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <header className="sticky top-0 z-50 border-b border-grid bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Mortgage Estate — home">
              <img src="/brand/mark.svg" alt="" className="h-7 w-7" />
              <span className="hidden font-display text-sm font-medium tracking-tight text-navy sm:block">
                Mortgage Estate
              </span>
            </Link>
            <span className="rounded border border-compass/40 bg-compass/5 px-1.5 py-0.5 font-mono text-[9px] tracking-eyebrow text-compass">
              APP
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 font-mono text-[10px] tracking-wider text-ledger lg:flex">
              <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
              BASE · #{block.toLocaleString("en-US")}
            </span>
            <ConnectWallet compact />
          </div>
        </div>

        {/* Section nav — scrollable on mobile */}
        <nav
          aria-label="App"
          className="mx-auto flex w-full max-w-[1400px] items-center gap-1 overflow-x-auto px-4 md:px-8"
        >
          {navItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex shrink-0 items-baseline gap-1.5 whitespace-nowrap px-3 py-2.5 transition-colors ${
                isActive(item.href) ? "text-compass" : "text-navy/70 hover:text-navy"
              }`}
            >
              <span className="font-mono text-[9px] text-compass/60">0{i + 1}</span>
              <span className="text-[12px] font-medium uppercase tracking-[0.12em]">
                {item.label}
              </span>
              {isActive(item.href) && (
                <span className="absolute inset-x-3 bottom-0 h-[2px] bg-compass" />
              )}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-20 md:px-8">
        {children}
      </main>

      <footer className="border-t border-grid bg-paper">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
            © 2026 MORTGAGE ESTATE PROTOCOL · APP v0.1 · CONTRACTS IN AUDIT
          </p>
          <div className="flex items-center gap-2">
            <svg width="11" height="11" viewBox="0 0 48 48" aria-hidden="true">
              <rect width="48" height="48" fill="#0052FF" />
            </svg>
            <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
              BUILT ON BASE · CHAIN 8453
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
