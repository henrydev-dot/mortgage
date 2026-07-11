"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Coins,
  Copy,
  Github,
  Globe,
  Mail,
  PlusCircle,
  Send,
  Twitter,
  Wallet,
  X,
} from "lucide-react";
import PixelGrid from "@/components/PixelGrid";
import {
  BASE_CHAIN,
  MRT_TOKEN,
  O1_BUY_URL,
  SOCIALS,
  metamaskDappLink,
} from "@/lib/airdrop";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  }, []);
  return { copied, copy };
}

interface LinkDef {
  icon: typeof Twitter;
  label: string;
  sub: string;
  href: string;
  featured?: boolean;
}

const links: LinkDef[] = [
  { icon: Twitter, label: "X", sub: SOCIALS.twitterHandle, href: SOCIALS.twitter },
  { icon: Globe, label: "Website", sub: "b20mortgage.com", href: "https://b20mortgage.com" },
  { icon: Wallet, label: "Launch App", sub: "b20mortgage.com/app", href: "/app" },
  { icon: Send, label: "Telegram", sub: "t.me/basedMortgage", href: SOCIALS.telegram },
  { icon: BookOpen, label: "Medium", sub: "b20mortgage.medium.com", href: SOCIALS.medium },
  { icon: Github, label: "GitHub", sub: "github.com/b20mortgage", href: SOCIALS.github },
  { icon: Coins, label: "Buy $MRT on o1", sub: "launch.o1.exchange", href: O1_BUY_URL, featured: true },
  { icon: Mail, label: "Support", sub: SOCIALS.email, href: `mailto:${SOCIALS.email}` },
];

/** Token detail popup — network / contract / add-to-wallet. */
function TokenModal({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const { copied, copy } = useCopy();
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const addToken = async () => {
    setNotice(null);
    const eth = (window as { ethereum?: { request: (a: { method: string; params?: unknown }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.location.href = metamaskDappLink();
        return;
      }
      setNotice("No wallet detected — add the token manually with the details above.");
      return;
    }
    try {
      const ok = await eth.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: MRT_TOKEN.address,
            symbol: MRT_TOKEN.symbol,
            decimals: MRT_TOKEN.decimals,
            image: MRT_TOKEN.image,
          },
        },
      });
      if (ok) setAdded(true);
    } catch {
      setNotice("Wallet declined — add the token manually with the details above.");
    }
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="MRT token details"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_32px_90px_-30px_rgba(29,37,84,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window chrome */}
        <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
          <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger sm:block">
            MRT://TOKEN
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto text-ledger transition-colors hover:text-navy"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <dl className="divide-y divide-grid">
          {(
            [
              ["NETWORK", `${BASE_CHAIN.name} · CHAIN ID ${BASE_CHAIN.id}`, null],
              ["CONTRACT", MRT_TOKEN.address, "contract"],
              ["SYMBOL", MRT_TOKEN.symbol, null],
              ["DECIMALS", String(MRT_TOKEN.decimals), null],
            ] as [string, string, string | null][]
          ).map(([label, value, copyId]) => (
            <div key={label} className="flex items-start gap-4 px-4 py-3">
              <dt className="w-20 shrink-0 pt-0.5 font-mono text-[9px] tracking-eyebrow text-ledger">
                {label}
              </dt>
              <dd className="flex min-w-0 flex-1 items-start justify-between gap-2 font-mono text-[11px] leading-relaxed text-navy">
                <span className="break-all">{value}</span>
                {copyId && (
                  <button
                    onClick={() => copy(copyId, value)}
                    aria-label="Copy contract address"
                    className="shrink-0 pt-0.5 text-ledger transition-colors hover:text-compass"
                  >
                    {copied === copyId ? (
                      <Check size={12} strokeWidth={2} className="text-compass" />
                    ) : (
                      <Copy size={12} strokeWidth={1.5} />
                    )}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-3 border-t border-grid bg-fog px-4 py-4">
          <button onClick={addToken} className="btn-primary !px-4 !py-2.5 !text-[12px]">
            <PlusCircle size={14} strokeWidth={1.5} />
            {added ? "MRT added to wallet" : "Add MRT to wallet"}
          </button>
          <a
            href={`${BASE_CHAIN.explorer}/token/${MRT_TOKEN.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-ledger transition-colors hover:text-compass"
          >
            BASESCAN
            <ArrowUpRight size={12} strokeWidth={1.5} />
          </a>
        </div>
        {notice && (
          <p className="border-t border-grid px-4 py-3 font-sans text-xs text-ledger">
            {notice}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function LinksClient() {
  const reduced = useReducedMotion();
  const [modalOpen, setModalOpen] = useState(false);

  const enter = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay: 0.08 + i * 0.05 },
        };

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <PixelGrid className="absolute inset-0 z-0 h-full w-full" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-40"
        style={{ background: "linear-gradient(rgba(255,255,255,0.9), transparent)" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-14">
        {/* Identity */}
        <motion.div {...enter(0)} className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Mortgage Estate — home">
            <img
              src="/brand/mark.png"
              alt="Mortgage Estate"
              className="h-20 w-20 rounded-full border border-grid bg-paper p-1 shadow-[0_16px_40px_-20px_rgba(29,37,84,0.4)]"
            />
          </Link>
          <h1 className="mt-5 font-display text-2xl tracking-tight text-navy">
            Mortgage Estate
          </h1>
          <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] tracking-eyebrow text-ledger">
            <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
            REAL ESTATE, TOKENIZED · LIVE ON BASE
          </p>
        </motion.div>

        {/* Links */}
        <div className="mt-10 flex flex-col gap-3">
          {links.map((link, i) => (
            <motion.a
              key={link.label}
              {...enter(i + 1)}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={`group flex items-center gap-4 rounded border px-5 py-4 transition-colors duration-200 ${
                link.featured
                  ? "border-compass bg-compass text-paper hover:bg-navy"
                  : "border-grid bg-paper text-navy hover:border-compass"
              }`}
            >
              <link.icon
                size={18}
                strokeWidth={1.5}
                className={link.featured ? "text-paper" : "text-compass"}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-sm font-medium">{link.label}</span>
                <span
                  className={`block truncate font-mono text-[10px] tracking-wider ${
                    link.featured ? "text-paper/60" : "text-ledger"
                  }`}
                >
                  {link.sub}
                </span>
              </span>
              <ArrowUpRight
                size={15}
                strokeWidth={1.75}
                className={`shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                  link.featured ? "text-paper/80" : "text-ledger group-hover:text-compass"
                }`}
              />
            </motion.a>
          ))}

          {/* Token detail — opens the popup */}
          <motion.button
            {...enter(links.length + 1)}
            onClick={() => setModalOpen(true)}
            className="group flex items-center gap-4 rounded border border-grid bg-paper px-5 py-4 text-left text-navy transition-colors duration-200 hover:border-compass"
          >
            <Wallet size={18} strokeWidth={1.5} className="text-compass" />
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-sm font-medium">Token Detail</span>
              <span className="block truncate font-mono text-[10px] tracking-wider text-ledger">
                $MRT · NETWORK · CONTRACT · ADD TO WALLET
              </span>
            </span>
            <PlusCircle
              size={15}
              strokeWidth={1.75}
              className="shrink-0 text-ledger transition-colors duration-200 group-hover:text-compass"
            />
          </motion.button>
        </div>

        {/* Footer */}
        <motion.div
          {...enter(links.length + 2)}
          className="mt-auto flex items-center justify-center gap-2 pt-12"
        >
          <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="48" height="48" fill="#0052FF" />
          </svg>
          <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
            BUILT ON BASE · © 2026 MORTGAGE ESTATE
          </span>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalOpen && <TokenModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}
