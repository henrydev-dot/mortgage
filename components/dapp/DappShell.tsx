"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Flame,
  Gift,
  Landmark,
  Layers,
  LifeBuoy,
  Link2,
  Menu,
  Scale,
  Vote,
  X,
} from "lucide-react";
import { useBlockNumber } from "@/components/useBlockNumber";
import { SOCIALS } from "@/lib/airdrop";
import ConnectWallet from "./ConnectWallet";

const nav = [
  {
    section: "MARKETS",
    items: [
      { label: "Properties", href: "/app", icon: Building2 },
      { label: "Stake", href: "/app/stake", icon: Layers },
      { label: "Lend & Borrow", href: "/app/lend", icon: Landmark },
    ],
  },
  {
    section: "PROTOCOL",
    items: [
      { label: "Buy & Burn", href: "/app/buyback", icon: Flame },
      { label: "Escrow", href: "/app/escrow", icon: Scale },
      { label: "DAO", href: "/app/dao", icon: Vote },
    ],
  },
  {
    section: "REWARDS",
    items: [{ label: "Airdrop", href: "/app/airdrop", icon: Gift }],
  },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <nav aria-label="App" className="flex-1 overflow-y-auto px-3 py-4">
      {nav.map((group) => (
        <div key={group.section} className="mb-5">
          <p className="mb-1.5 px-3 font-mono text-[9px] tracking-eyebrow text-ledger">
            {group.section}
          </p>
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`mb-0.5 flex items-center gap-3 rounded px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-compass/[0.07] text-compass"
                    : "text-navy/70 hover:bg-fog hover:text-navy"
                }`}
              >
                <item.icon size={16} strokeWidth={1.5} className={active ? "text-compass" : "text-ledger"} />
                <span className="font-sans text-[13px] font-medium">{item.label}</span>
                {active && <span className="ml-auto h-1 w-1 rounded-full bg-compass" />}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const block = useBlockNumber();
  return (
    <div className="border-t border-grid px-5 py-4">
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ledger">
        <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
        BASE · #{block.toLocaleString("en-US")}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <a
          href={SOCIALS.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-ledger transition-colors hover:text-compass"
        >
          <LifeBuoy size={11} strokeWidth={1.5} />
          SUPPORT
        </a>
        <Link
          href="/links"
          className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-ledger transition-colors hover:text-compass"
        >
          <Link2 size={11} strokeWidth={1.5} />
          LINKS
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <svg width="10" height="10" viewBox="0 0 48 48" aria-hidden="true">
          <rect width="48" height="48" fill="#0052FF" />
        </svg>
        <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
          BUILT ON BASE · v0.1
        </span>
      </div>
    </div>
  );
}

export default function DappShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-fog">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-grid bg-paper lg:flex">
        <Link
          href="/"
          className="flex items-center gap-2.5 border-b border-grid px-5 py-4"
          aria-label="Mortgage Estate — home"
        >
          <img src="/brand/mark.svg" alt="" className="h-7 w-7" />
          <span className="font-display text-sm font-medium tracking-tight text-navy">
            Mortgage Estate
          </span>
          <span className="rounded border border-compass/40 bg-compass/5 px-1.5 py-0.5 font-mono text-[8px] tracking-eyebrow text-compass">
            APP
          </span>
        </Link>
        <NavList pathname={pathname} />
        <SidebarFooter />
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-grid bg-paper/85 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center text-navy"
              >
                {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
              <Link href="/" className="flex items-center gap-2" aria-label="Mortgage Estate — home">
                <img src="/brand/mark.svg" alt="" className="h-6 w-6" />
                <span className="rounded border border-compass/40 bg-compass/5 px-1.5 py-0.5 font-mono text-[8px] tracking-eyebrow text-compass">
                  APP
                </span>
              </Link>
            </div>
            <div className="hidden lg:block" />
            <ConnectWallet compact />
          </div>

          {/* Mobile drawer */}
          {menuOpen && (
            <div className="border-t border-grid bg-paper lg:hidden">
              <NavList pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </div>
          )}
        </header>

        <main className="w-full max-w-[1200px] flex-1 px-4 py-8 md:px-8">{children}</main>

        <footer className="border-t border-grid bg-paper">
          <div className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
              © 2026 MORTGAGE ESTATE PROTOCOL · CONTRACTS IN AUDIT
            </p>
            <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
              NOT INVESTMENT ADVICE · DYOR
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
