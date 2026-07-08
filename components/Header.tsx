"use client";

import { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Properties", href: "#properties" },
  { label: "Invest", href: "#invest" },
  { label: "Protocol", href: "#why" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Docs", href: "#papers" },
];

export default function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 80));

  // Logo eases down from 32px to 26px tall as the hero scrolls away
  const logoHeight = useTransform(scrollY, [0, 240], [32, 26]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "border-b border-grid bg-paper/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container-line flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Mortgage Estate — home">
          <motion.img
            src="/brand/logo.png"
            alt="Mortgage Estate"
            style={{ height: logoHeight }}
            className="w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/whitepaper" className="btn-ghost !px-4 !py-2 text-sm">
            Whitepaper
          </Link>
          <a href="#properties" className="btn-primary !px-4 !py-2 text-sm">
            Explore Properties
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center text-navy lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-grid bg-paper/95 backdrop-blur-md lg:hidden">
          <nav className="container-line flex flex-col py-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="border-b border-grid py-3 font-sans text-sm text-navy last:border-b-0"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-4">
              <Link href="/whitepaper" className="btn-ghost flex-1 justify-center !py-2.5">
                Whitepaper
              </Link>
              <a
                href="#properties"
                className="btn-primary flex-1 justify-center !py-2.5"
                onClick={() => setMenuOpen(false)}
              >
                Explore
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
