"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ExternalLink,
  Flame,
  Gift,
  LayoutDashboard,
  Layers,
  LogOut,
  Mail,
  Menu,
  ReceiptText,
  Scale,
  Settings,
  Users,
  X,
} from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Properties", href: "/admin/properties", icon: Building2 },
  { label: "Reservations", href: "/admin/orders", icon: ReceiptText },
  { label: "App settings", href: "/admin/settings", icon: Settings },
  { label: "Stake pools", href: "/admin/pools", icon: Layers },
  { label: "Escrow agents", href: "/admin/escrow", icon: Scale },
  { label: "Airdrop", href: "/admin/airdrop", icon: Gift },
  { label: "Buy & burn", href: "/admin/burns", icon: Flame },
  { label: "Waitlist", href: "/admin/emails", icon: Mail },
  { label: "Admin users", href: "/admin/users", icon: Users },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
    </nav>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // The login screen stands alone — no chrome
  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-fog">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-grid bg-paper lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 border-b border-grid px-5 py-4">
          <img src="/brand/mark.svg" alt="" className="h-7 w-7" />
          <span className="font-display text-sm font-medium tracking-tight text-navy">
            Mortgage Estate
          </span>
          <span className="rounded border border-coral/40 bg-coral/5 px-1.5 py-0.5 font-mono text-[8px] tracking-eyebrow text-coral">
            ADMIN
          </span>
        </Link>
        <NavList pathname={pathname} />
        <div className="border-t border-grid px-3 py-3">
          <a
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded px-3 py-2 text-navy/70 transition-colors hover:bg-fog hover:text-navy"
          >
            <ExternalLink size={15} strokeWidth={1.5} className="text-ledger" />
            <span className="font-sans text-[13px] font-medium">View app</span>
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-navy/70 transition-colors hover:bg-fog hover:text-coral"
          >
            <LogOut size={15} strokeWidth={1.5} className="text-ledger" />
            <span className="font-sans text-[13px] font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-col lg:pl-56">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-grid bg-paper/85 backdrop-blur-md">
          <div className="flex h-13 items-center justify-between gap-4 px-4 py-2.5 md:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center text-navy"
              >
                {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
              <Link href="/admin" className="flex items-center gap-2">
                <img src="/brand/mark.svg" alt="" className="h-6 w-6" />
                <span className="rounded border border-coral/40 bg-coral/5 px-1.5 py-0.5 font-mono text-[8px] tracking-eyebrow text-coral">
                  ADMIN
                </span>
              </Link>
            </div>
            <span className="hidden font-mono text-[10px] tracking-eyebrow text-ledger lg:block">
              MRT://ADMIN_CONSOLE
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded border border-grid px-3 py-1.5 font-mono text-[10px] tracking-wider text-ledger transition-colors hover:border-coral hover:text-coral lg:hidden"
            >
              <LogOut size={12} strokeWidth={1.5} />
              SIGN OUT
            </button>
            <span className="hidden font-mono text-[10px] tracking-wider text-ledger lg:block">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {menuOpen && (
            <div className="border-t border-grid bg-paper lg:hidden">
              <NavList pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </div>
          )}
        </header>

        <main className="w-full max-w-[1100px] flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
