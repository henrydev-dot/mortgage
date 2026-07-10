"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Copy,
  Link2,
  Loader2,
  PlusCircle,
  Send,
  Twitter,
  Wallet,
  XCircle,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import PixelGrid from "@/components/PixelGrid";
import DecodeText from "@/components/DecodeText";
import Reveal from "@/components/Reveal";
import {
  AIRDROP,
  BASE_CHAIN,
  MRT_TOKEN,
  SOCIALS,
  isValidAddress,
  metamaskDappLink,
  referralLink,
  shortAddress,
  tweetIntentUrl,
} from "@/lib/airdrop";

type WalletMode = "connect" | "manual";
type TaskId = "follow" | "tweet" | "telegram" | "medium";

interface ApplicationStatus {
  applied: boolean;
  status?: string;
  referrals?: number;
  referralEarned?: number;
}

const STEP_LABEL = "font-mono text-[10px] tracking-eyebrow text-compass";

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

/** RainbowKit connect button rendered in the site's own button style. */
function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        if (!connected) {
          return (
            <button onClick={openConnectModal} className="btn-primary">
              <Wallet size={16} strokeWidth={1.75} />
              Connect Wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} className="btn-coral">
              Switch to Base
            </button>
          );
        }
        return (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAccountModal}
              className="inline-flex items-center gap-2 rounded border border-compass/40 bg-compass/5 px-3 py-2.5 font-mono text-[12px] text-compass transition-colors hover:border-compass"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-compass" />
              {account.displayName} · CONNECTED
            </button>
            <button
              onClick={openChainModal}
              className="font-mono text-[10px] tracking-wider text-ledger underline-offset-2 hover:text-navy hover:underline"
            >
              {chain.name?.toUpperCase()}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

/** Manual token details for wallets that can't use watchAsset. */
function ManualTokenInfo({
  copied,
  copy,
}: {
  copied: string | null;
  copy: (id: string, text: string) => void;
}) {
  const rows: [string, string, string | null][] = [
    ["NETWORK", `${BASE_CHAIN.name} · CHAIN ID ${BASE_CHAIN.id}`, null],
    ["CONTRACT", MRT_TOKEN.address, "addr"],
    ["SYMBOL", MRT_TOKEN.symbol, null],
    ["DECIMALS", String(MRT_TOKEN.decimals), null],
  ];
  return (
    <div className="rounded border border-grid bg-fog p-4">
      <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
        MANUAL IMPORT — ADD CUSTOM TOKEN IN YOUR WALLET
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value, copyId]) => (
          <div key={label} className="flex items-center gap-3">
            <dt className="w-20 shrink-0 font-mono text-[9px] tracking-eyebrow text-ledger">
              {label}
            </dt>
            <dd className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-navy">
              <span className="truncate">{value}</span>
              {copyId && (
                <button
                  onClick={() => copy(copyId, value)}
                  aria-label={`Copy ${label.toLowerCase()}`}
                  className="shrink-0 text-ledger transition-colors hover:text-compass"
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
    </div>
  );
}

/**
 * Standalone referral-link generator — works without applying.
 * Registers the wallet in the referral ledger and shows live stats.
 */
function ReferralCard({
  presetAddress,
  copied,
  copy,
}: {
  presetAddress: string | null;
  copied: string | null;
  copy: (id: string, text: string) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    link: string;
    referrals: number;
    referralEarned: number;
  } | null>(null);

  // Follow the wallet chosen in step 01 until the user types their own
  useEffect(() => {
    if (presetAddress) setInput(presetAddress);
  }, [presetAddress]);

  const generate = async () => {
    const address = input.trim();
    if (!isValidAddress(address)) {
      setError("Enter a valid 0x… wallet address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border border-grid bg-paper p-6">
      <p className="eyebrow mb-2">GET YOUR REFERRAL LINK</p>
      <p className="font-sans text-xs leading-relaxed text-ledger">
        Enter your wallet, get your link, share it — every application
        through it queues +{AIRDROP.referralBonus} MRT for you. No
        application required to start referring.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder="0x… your wallet address"
          spellCheck={false}
          className="h-10 w-full rounded border border-grid bg-paper px-3 font-mono text-[11px] text-navy placeholder:text-ledger/70 focus:border-compass focus:outline-none"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary justify-center !py-2.5 !text-[12px] disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
          ) : (
            <Link2 size={14} strokeWidth={1.5} />
          )}
          {result ? "Refresh stats" : "Generate link"}
        </button>
      </div>
      {error && (
        <p className="mt-2 font-mono text-[10px] tracking-wider text-coral">
          {error.toUpperCase()}
        </p>
      )}
      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded border border-grid bg-fog px-3 py-2 font-mono text-[10px] text-navy">
              {result.link}
            </code>
            <button
              onClick={() => copy("refcard", result.link)}
              aria-label="Copy referral link"
              className="shrink-0 rounded border border-grid p-2 text-ledger transition-colors hover:border-compass hover:text-compass"
            >
              {copied === "refcard" ? (
                <Check size={13} strokeWidth={2} className="text-compass" />
              ) : (
                <Copy size={13} strokeWidth={1.5} />
              )}
            </button>
          </div>
          <p className="font-mono text-[10px] tracking-wider text-compass">
            REFERRED APPLICATIONS: {result.referrals} · +{result.referralEarned}{" "}
            MRT QUEUED
          </p>
          <a
            href={tweetIntentUrl(input.trim())}
            target="_blank"
            rel="noopener noreferrer"
            className="arrow-link font-mono !text-[11px] tracking-wider"
          >
            SHARE ON X
            <ArrowUpRight size={13} strokeWidth={1.75} />
          </a>
        </div>
      )}
    </div>
  );
}

export default function AirdropClient() {
  const reduced = useReducedMotion();
  const { copied, copy } = useCopy();

  // Wallet — RainbowKit/wagmi for connections, or a manually typed address
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const [mode, setMode] = useState<WalletMode>("connect");
  const [manual, setManual] = useState("");
  const [tokenAdded, setTokenAdded] = useState(false);
  const [tokenNotice, setTokenNotice] = useState<string | null>(null);
  const [showManualToken, setShowManualToken] = useState(false);
  // Mobile browsers have no injected provider — watchAsset needs the
  // MetaMask in-app browser there, reached via deep link
  const [env, setEnv] = useState({ injected: false, mobile: false });

  useEffect(() => {
    setEnv({
      injected: typeof (window as { ethereum?: unknown }).ethereum !== "undefined",
      mobile: /android|iphone|ipad|ipod/i.test(navigator.userAgent),
    });
  }, []);

  // Tasks
  const [tasks, setTasks] = useState<Record<TaskId, boolean>>({
    follow: false,
    tweet: false,
    telegram: false,
    medium: false,
  });
  const [tweetUrl, setTweetUrl] = useState("");

  // Referral
  const [ref, setRef] = useState<string | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const address = mode === "connect" ? connectedAddress ?? null : manual.trim();
  const addressValid = !!address && isValidAddress(address);
  const allTasksDone = Object.values(tasks).every(Boolean);
  const tweetUrlValid =
    tweetUrl.trim() === "" ||
    /^https?:\/\/(x\.com|twitter\.com)\/.+/i.test(tweetUrl.trim());
  const applied = submitted || Boolean(status?.applied);
  const canSubmit = addressValid && allTasksDone && tweetUrlValid && !submitting && !applied;

  // Pick up ?ref= from the URL
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("ref");
    if (param && isValidAddress(param)) setRef(param);
  }, []);

  // Check application status whenever a valid address is set
  useEffect(() => {
    if (!addressValid || !address) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/airdrop?address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address, addressValid, submitted]);

  // Add MRT via the connected wallet (RainbowKit → wagmi wallet client).
  // On mobile without an injected provider, reopen the page inside the
  // MetaMask app browser where watchAsset actually works.
  const addToken = async () => {
    setTokenNotice(null);
    if (!walletClient) {
      if (env.mobile && !env.injected) {
        window.location.href = metamaskDappLink();
        return;
      }
      setShowManualToken(true);
      setTokenNotice(
        "Connect a wallet first, or add the token manually with the details shown."
      );
      return;
    }
    try {
      const ok = await walletClient.watchAsset({
        type: "ERC20",
        options: {
          address: MRT_TOKEN.address,
          symbol: MRT_TOKEN.symbol,
          decimals: MRT_TOKEN.decimals,
          image: MRT_TOKEN.image,
        },
      });
      if (ok) setTokenAdded(true);
    } catch {
      setShowManualToken(true);
      setTokenNotice(
        "Your wallet declined the request — add the token manually with the details shown."
      );
    }
  };

  const openTask = (id: TaskId, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setTasks((t) => ({ ...t, [id]: true }));
  };

  const submit = async () => {
    if (!canSubmit || !address) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/airdrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          ref: ref || undefined,
          tweetUrl: tweetUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setSubmitted(true);
        setSubmitError(data.error || "Something went wrong.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const myReferralLink = useMemo(
    () => (addressValid && address ? referralLink(address) : null),
    [address, addressValid]
  );

  const taskDefs: {
    id: TaskId;
    icon: typeof Twitter;
    title: string;
    desc: string;
    action: string;
    url: string;
  }[] = [
    {
      id: "follow",
      icon: Twitter,
      title: "Follow on X",
      desc: `Follow ${SOCIALS.twitterHandle} for mint announcements.`,
      action: "Follow",
      url: SOCIALS.twitter,
    },
    {
      id: "tweet",
      icon: Send,
      title: "Post on X",
      desc: "Share the airdrop — your referral link is prefilled in the post.",
      action: "Post",
      url: tweetIntentUrl(addressValid && address ? address : undefined),
    },
    {
      id: "telegram",
      icon: Send,
      title: "Join Telegram",
      desc: "Join the community channel.",
      action: "Join",
      url: SOCIALS.telegram,
    },
    {
      id: "medium",
      icon: BookOpen,
      title: "Read Medium",
      desc: "Check the latest protocol article.",
      action: "Read",
      url: SOCIALS.medium,
    },
  ];

  const doneCount = Object.values(tasks).filter(Boolean).length;

  return (
    <main>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative isolate overflow-hidden pt-16">
        <PixelGrid className="absolute inset-0 z-0 h-full w-full" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32"
          style={{ background: "linear-gradient(rgba(255,255,255,0.9), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full lg:w-[70%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 60%, transparent 100%)",
          }}
        />

        <div className="container-line relative z-10 grid grid-cols-[minmax(0,1fr)] items-center gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div className="min-w-0">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="eyebrow mb-6 flex items-center gap-2.5 !text-navy"
            >
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-coral" />
              AIRDROP · LIVE ON BASE
            </motion.p>
            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="font-display text-[42px] leading-[1.02] tracking-tight text-navy sm:text-[58px] xl:text-[68px]"
            >
              Claim your{" "}
              <DecodeText text="$MRT." className="font-bold text-compass" startDelay={400} />
            </motion.h1>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mt-6 max-w-lg font-sans text-base leading-relaxed text-ledger sm:text-lg"
            >
              {AIRDROP.claimAmount.toLocaleString("en-US")} MRT for every verified
              application. Earn {AIRDROP.referralBonus} MRT more for every wallet
              that applies through your referral link.
            </motion.p>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="mt-8 flex flex-wrap gap-x-8 gap-y-4"
            >
              {[
                [`${AIRDROP.claimAmount.toLocaleString("en-US")} MRT`, "PER APPLICATION"],
                [`+${AIRDROP.referralBonus} MRT`, "PER REFERRAL"],
                ["BASE", "CHAIN 8453"],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-grid pl-4">
                  <p className="font-mono text-xl text-navy">{value}</p>
                  <p className="mt-1 font-mono text-[9px] tracking-eyebrow text-ledger">
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Token card — fills the right column, manual details always visible */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="w-full min-w-0 lg:justify-self-end"
          >
            <div className="overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_24px_70px_-36px_rgba(29,37,84,0.35)]">
              <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
                <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger sm:block">
                  MRT://TOKEN
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-compass">
                  <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
                  BASE MAINNET
                </span>
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
                  {tokenAdded ? "MRT added to wallet" : "Add MRT to wallet"}
                </button>
                {env.mobile && !env.injected && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = metamaskDappLink();
                    }}
                    className="btn-ghost !bg-paper !px-4 !py-2.5 !text-[12px]"
                  >
                    Open in MetaMask
                  </a>
                )}
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
              {tokenNotice && (
                <p className="border-t border-grid px-4 py-3 font-sans text-xs text-ledger">
                  {tokenNotice}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------- Claim console --------------------------- */}
      <section className="relative z-10 border-t border-grid bg-fog py-16 md:py-24">
        <div className="container-line grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Console window */}
          <Reveal className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_24px_70px_-36px_rgba(29,37,84,0.35)]">
              {/* Window chrome */}
              <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
                <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger sm:block">
                  MRT://AIRDROP_CONSOLE
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-compass">
                  <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
                  BASE MAINNET
                </span>
              </div>

              {applied ? (
                /* ------------------------- Applied state ------------------------- */
                <div className="p-6 md:p-10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-compass/40 bg-compass/10">
                      <Clock size={18} strokeWidth={1.75} className="text-compass" />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl text-navy">
                        Application received.
                      </h2>
                      <p className="font-mono text-[11px] tracking-wider text-ledger">
                        STATUS: PENDING REVIEW ·{" "}
                        {AIRDROP.claimAmount.toLocaleString("en-US")} MRT →{" "}
                        {address ? shortAddress(address) : ""}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 max-w-lg font-sans text-sm leading-relaxed text-ledger">
                    Applications are reviewed and distributed in batches from the
                    protocol treasury. Your {AIRDROP.claimAmount.toLocaleString("en-US")}{" "}
                    MRT — plus {AIRDROP.referralBonus} MRT for each wallet that
                    applies with your link — will arrive in this wallet after
                    approval. No further action needed.
                  </p>

                  {typeof status?.referrals === "number" && status.referrals > 0 && (
                    <p className="mt-4 font-mono text-[11px] tracking-wider text-compass">
                      REFERRALS SO FAR: {status.referrals} · +
                      {status.referralEarned} MRT QUEUED
                    </p>
                  )}

                  {myReferralLink && (
                    <div className="mt-8 rounded border border-grid bg-fog p-5">
                      <p className={STEP_LABEL}>
                        YOUR REFERRAL LINK · +{AIRDROP.referralBonus} MRT PER APPLICATION
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <code className="min-w-0 flex-1 truncate rounded border border-grid bg-paper px-3 py-2.5 font-mono text-[11px] text-navy">
                          {myReferralLink}
                        </code>
                        <button
                          onClick={() => copy("reflink", myReferralLink)}
                          className="btn-primary !px-4 !py-2.5 !text-[12px]"
                        >
                          {copied === "reflink" ? (
                            <>
                              <Check size={14} strokeWidth={2} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} strokeWidth={1.5} /> Copy link
                            </>
                          )}
                        </button>
                        <a
                          href={tweetIntentUrl(address!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost !px-4 !py-2.5 !text-[12px]"
                        >
                          <Twitter size={14} strokeWidth={1.5} />
                          Share
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button onClick={addToken} className="btn-ghost !px-4 !py-2.5 !text-[12px]">
                      <PlusCircle size={14} strokeWidth={1.5} />
                      {tokenAdded ? "MRT added to wallet" : "Add MRT to your wallet"}
                    </button>
                    <button
                      onClick={() => setShowManualToken((v) => !v)}
                      className="font-mono text-[10px] tracking-wider text-ledger underline-offset-2 hover:text-navy hover:underline"
                    >
                      MANUAL TOKEN INFO
                    </button>
                  </div>
                  {showManualToken && (
                    <div className="mt-4 max-w-md">
                      <ManualTokenInfo copied={copied} copy={copy} />
                    </div>
                  )}
                </div>
              ) : (
                /* --------------------------- Form state --------------------------- */
                <div className="divide-y divide-grid">
                  {/* STEP 01 — WALLET */}
                  <div className="p-6 md:p-8">
                    <p className={STEP_LABEL}>STEP 01 — WALLET</p>
                    <div className="mt-4 flex gap-2">
                      {(
                        [
                          ["connect", "Connect Wallet"],
                          ["manual", "Enter address"],
                        ] as [WalletMode, string][]
                      ).map(([m, label]) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={`rounded border px-4 py-2 font-mono text-[11px] tracking-wider transition-colors ${
                            mode === m
                              ? "border-compass bg-compass/5 text-compass"
                              : "border-grid text-ledger hover:border-compass/50 hover:text-navy"
                          }`}
                        >
                          {label.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5">
                      {mode === "connect" ? (
                        <div>
                          <ConnectWallet />
                          {isConnected && (
                            <button
                              onClick={() => disconnect()}
                              className="mt-3 font-mono text-[10px] tracking-wider text-ledger underline-offset-2 hover:text-navy hover:underline"
                            >
                              DISCONNECT
                            </button>
                          )}
                          <p className="mt-3 font-sans text-xs text-ledger">
                            MetaMask, Coinbase Wallet, WalletConnect and more —
                            works on mobile via deep links and QR.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <input
                            value={manual}
                            onChange={(e) => setManual(e.target.value)}
                            placeholder="0x… your Base wallet address"
                            spellCheck={false}
                            className="h-11 w-full max-w-md rounded border border-grid bg-paper px-3 font-mono text-[12px] text-navy placeholder:text-ledger/70 focus:border-compass focus:outline-none"
                          />
                          {manual.trim() !== "" && !isValidAddress(manual) && (
                            <p className="mt-2 font-mono text-[10px] tracking-wider text-coral">
                              INVALID ADDRESS FORMAT
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP 02 — TASKS */}
                  <div className="p-6 md:p-8">
                    <div className="flex items-baseline justify-between">
                      <p className={STEP_LABEL}>STEP 02 — TASKS</p>
                      <p className="font-mono text-[10px] tracking-wider text-ledger">
                        {doneCount}/4 COMPLETE
                      </p>
                    </div>
                    <div className="mt-4 divide-y divide-grid border-y border-grid">
                      {taskDefs.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 py-4 sm:gap-4">
                          <button
                            onClick={() =>
                              setTasks((t) => ({ ...t, [task.id]: !t[task.id] }))
                            }
                            aria-label={`Mark ${task.title} ${tasks[task.id] ? "incomplete" : "complete"}`}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                              tasks[task.id]
                                ? "border-compass bg-compass text-paper"
                                : "border-grid bg-paper hover:border-compass/50"
                            }`}
                          >
                            {tasks[task.id] && <Check size={12} strokeWidth={3} />}
                          </button>
                          <task.icon
                            size={18}
                            strokeWidth={1.5}
                            className="shrink-0 text-compass"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-sm font-medium text-navy">
                              {task.title}
                            </p>
                            <p className="truncate font-sans text-xs text-ledger">
                              {task.desc}
                            </p>
                          </div>
                          <button
                            onClick={() => openTask(task.id, task.url)}
                            className="arrow-link shrink-0 font-mono !text-[11px] tracking-wider"
                          >
                            {task.action.toUpperCase()}
                            <ArrowUpRight size={13} strokeWidth={1.75} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block font-mono text-[10px] tracking-eyebrow text-ledger">
                        TWEET URL (OPTIONAL)
                      </label>
                      <input
                        value={tweetUrl}
                        onChange={(e) => setTweetUrl(e.target.value)}
                        placeholder="https://x.com/you/status/…"
                        spellCheck={false}
                        className="mt-2 h-10 w-full max-w-md rounded border border-grid bg-paper px-3 font-mono text-[12px] text-navy placeholder:text-ledger/70 focus:border-compass focus:outline-none"
                      />
                      {!tweetUrlValid && (
                        <p className="mt-2 font-mono text-[10px] tracking-wider text-coral">
                          MUST BE AN X.COM STATUS LINK
                        </p>
                      )}
                    </div>
                  </div>

                  {/* STEP 03 — SUBMIT */}
                  <div className="p-6 md:p-8">
                    <p className={STEP_LABEL}>STEP 03 — SUBMIT</p>
                    {ref && (
                      <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-ledger">
                        <Link2 size={13} strokeWidth={1.5} className="text-compass" />
                        REFERRED BY {shortAddress(ref)}
                        <button
                          onClick={() => setRef(null)}
                          className="text-ledger underline-offset-2 hover:text-navy hover:underline"
                        >
                          REMOVE
                        </button>
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <button
                        onClick={submit}
                        disabled={!canSubmit}
                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            Submit application
                            <ArrowRight size={16} strokeWidth={1.75} />
                          </>
                        )}
                      </button>
                      <p className="font-mono text-[10px] tracking-wider text-ledger">
                        {addressValid
                          ? allTasksDone
                            ? `${AIRDROP.claimAmount.toLocaleString("en-US")} MRT → ${shortAddress(address!)} AFTER REVIEW`
                            : "COMPLETE ALL TASKS TO SUBMIT"
                          : "SET A WALLET TO SUBMIT"}
                      </p>
                    </div>
                    <AnimatePresence>
                      {submitError && (
                        <motion.p
                          initial={reduced ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-4 flex items-center gap-1.5 font-sans text-sm text-coral"
                        >
                          <XCircle size={14} strokeWidth={1.5} />
                          {submitError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Side rail — how it works */}
          <div className="min-w-0 space-y-6">
            <Reveal index={1}>
              <div className="rounded border border-grid bg-paper p-6">
                <p className="eyebrow mb-5">HOW IT WORKS</p>
                <ol className="space-y-5">
                  {[
                    ["01", "Set your wallet", "Connect any wallet via RainbowKit — MetaMask, Coinbase, WalletConnect on mobile — or paste an address."],
                    ["02", "Complete the tasks", "Follow, post, join, read. Four clicks, one minute."],
                    ["03", "Submit", "Your application is queued for review — approved wallets receive tokens from the treasury in batches."],
                    ["04", "Refer", `Share your link. Every referred application queues +${AIRDROP.referralBonus} MRT for you.`],
                  ].map(([num, title, desc]) => (
                    <li key={num} className="flex gap-4">
                      <span className="font-mono text-[11px] text-compass">{num}</span>
                      <div>
                        <p className="font-sans text-sm font-medium text-navy">{title}</p>
                        <p className="mt-1 font-sans text-xs leading-relaxed text-ledger">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal index={2}>
              <ReferralCard
                presetAddress={addressValid && address ? address : null}
                copied={copied}
                copy={copy}
              />
            </Reveal>

            <Reveal index={3}>
              <div className="rounded border border-grid bg-paper p-6">
                <p className="eyebrow mb-4">DISTRIBUTION RULES</p>
                <ul className="space-y-2.5 font-mono text-[11px] leading-relaxed tracking-wide text-ledger">
                  <li>· ONE APPLICATION PER WALLET</li>
                  <li>· {AIRDROP.claimAmount.toLocaleString("en-US")} MRT PER APPROVED APPLICATION</li>
                  <li>· +{AIRDROP.referralBonus} MRT PER REFERRED APPLICATION</li>
                  <li>· DISTRIBUTED IN REVIEWED BATCHES</li>
                  <li>· SETTLED ON BASE · CHAIN 8453</li>
                </ul>
                <a
                  href={`${BASE_CHAIN.explorer}/token/${MRT_TOKEN.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arrow-link mt-5 font-mono !text-[11px] tracking-wider"
                >
                  TOKEN ON BASESCAN
                  <ArrowUpRight size={13} strokeWidth={1.75} />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
