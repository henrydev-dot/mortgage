import Link from "next/link";
import { Twitter, Send } from "lucide-react";

const columns = [
  {
    title: "Protocol",
    links: ["Launch App", "Properties", "Airdrop", "Secondary Market"],
  },
  {
    title: "Resources",
    links: ["Lightpaper", "Whitepaper", "Documentation", "Audit Reports"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Press Kit", "Contact"],
  },
  {
    title: "Legal",
    links: ["Terms of Service", "Privacy Policy", "Risk Disclosure", "Licenses"],
  },
];

const socials = [
  { icon: Twitter, label: "Twitter / X", href: "https://x.com/BasedMortgage" },
  { icon: Send, label: "Telegram", href: "https://t.me/basedMortgage" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-paper">
      <div className="container-line grid gap-12 py-16 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <img
            src="/brand/logo-white.svg"
            alt="Mortgage Estate"
            className="h-7 w-auto"
          />
          <p className="mt-5 max-w-xs font-sans text-sm leading-relaxed text-paper/50">
            Fractional ownership of the world&apos;s most desirable addresses —
            verified, custodied, and settled on Base.
          </p>
          <div className="mt-6 flex gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="text-paper/50 transition-colors duration-200 hover:text-paper"
              >
                <s.icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-mono text-[10px] tracking-eyebrow text-paper/40">
              {col.title.toUpperCase()}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => {
                const href =
                  link === "Whitepaper"
                    ? "/whitepaper"
                    : link === "Lightpaper"
                      ? "/lightpaper"
                      : link === "Airdrop"
                        ? "/app/airdrop"
                        : link === "Launch App"
                          ? "/app"
                          : link === "Properties"
                            ? "/app"
                            : "#";
                return (
                  <li key={link}>
                    <Link
                      href={href}
                      className="font-sans text-sm text-paper/60 transition-colors duration-200 hover:text-paper"
                    >
                      {link}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-paper/10">
        <div className="container-line flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[10px] tracking-wider text-paper/35">
            © 2026 MORTGAGE ESTATE PROTOCOL. ALL RIGHTS RESERVED.
          </p>
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-paper/50 transition-colors hover:text-paper"
          >
            <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
              <rect width="48" height="48" fill="#0052FF" />
            </svg>
            <span className="font-mono text-[10px] tracking-eyebrow">BUILT ON BASE</span>
          </a>
        </div>
        <div className="container-line pb-8">
          <p className="max-w-4xl font-sans text-[11px] leading-relaxed text-paper/30">
            Property tokens are securities in most jurisdictions and are offered
            only to verified investors under applicable frameworks. Digital
            assets involve risk, including possible loss of principal. Past
            rental yield is not indicative of future returns. Nothing on this
            page constitutes investment, legal, or tax advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
