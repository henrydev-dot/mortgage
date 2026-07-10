"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Link2,
  Loader2,
  PlusCircle,
  Send,
  Twitter,
  Wallet,
  XCircle,
} from "lucide-react";
import PixelGrid from "@/components/PixelGrid";
import DecodeText from "@/components/DecodeText";
import Reveal from "@/components/Reveal";
import {
  AIRDROP,
  BASE_CHAIN,
  MRT_TOKEN,
  SOCIALS,
  isValidAddress,
  referralLink,
  shortAddress,
  tweetIntentUrl,
} from "@/lib/airdrop";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
    };
  }
}

type WalletMode = "connect" | "manual";
type TaskId = "follow" | "tweet" | "telegram" | "medium";

interface ClaimResult {
  txHash: string;
  explorer: string;
  referralCredited: boolean;
}

const STEP_LABEL = "font-mono text-[10px] tracking-eyebrow text-compass";

/* ---------------------------------- helpers --------------------------------- */

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

async function switchToBase(eth: NonNullable<Window["ethereum"]>) {
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN.hexId }],
    });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_CHAIN.hexId,
          chainName: BASE_CHAIN.name,
          rpcUrls: [BASE_CHAIN.rpcUrl],
          blockExplorerUrls: [BASE_CHAIN.explorer],
          nativeCurrency: BASE_CHAIN.nativeCurrency,
        },
      ],
    });
  }
}

/* --------------------------------- component -------------------------------- */

export default function AirdropClient() {
  const reduced = useReducedMotion();
  const { copied, copy } = useCopy();

  // Wallet
  const [mode, setMode] = useState<WalletMode>("connect");
  const [connected, setConnected] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [tokenAdded, setTokenAdded] = useState(false);

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
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState<{
    txHash?: string;
    referrals?: number;
    referralEarned?: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const address = mode === "connect" ? connected : manual.trim();
  const addressValid = !!address && isValidAddress(address);
  const allTasksDone = Object.values(tasks).every(Boolean);
  const tweetUrlValid =
    tweetUrl.trim() === "" ||
    /^https?:\/\/(x\.com|twitter\.com)\/.+/i.test(tweetUrl.trim());
  const canSubmit =
    addressValid && allTasksDone && tweetUrlValid && !submitting && !result;

  // Pick up ?ref= from the URL
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("ref");
    if (param && isValidAddress(param)) setRef(param);
  }, []);

  // Check claim status whenever a valid address is set
  useEffect(() => {
    if (!addressValid || !address) {
      setAlreadyClaimed(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/airdrop?address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.claimed) setAlreadyClaimed(data);
        if (!cancelled && !data.claimed) setAlreadyClaimed(null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address, addressValid]);

  const connect = async () => {
    setWalletError(null);
    const eth = window.ethereum;
    if (!eth) {
      setWalletError(
        "No wallet detected. Install MetaMask, or enter your address manually."
      );
      return;
    }
    try {
      const accounts = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts?.[0]) {
        setConnected(accounts[0]);
        await switchToBase(eth).catch(() => {});
      }
    } catch {
      setWalletError("Connection rejected.");
    }
  };

  const addToken = async () => {
    const eth = window.ethereum;
    if (!eth) {
      setWalletError(
        "No wallet detected — copy the contract address below and add it manually."
      );
      return;
    }
    try {
      await eth.request({
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
      setTokenAdded(true);
    } catch {
      /* user dismissed */
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
        if (res.status === 409 && data.txHash) {
          setAlreadyClaimed({ txHash: data.txHash });
        }
        setSubmitError(data.error || "Something went wrong.");
        return;
      }
      setResult(data);
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
      <section className="relative overflow-hidden pt-16">
        <PixelGrid className="absolute inset-0 h-full w-full" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: "linear-gradient(rgba(255,255,255,0.9), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[70%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 60%, transparent 100%)",
          }}
        />

        <div className="container-line relative z-10 py-20 md:py-28">
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
            className="font-display text-[44px] leading-[1.02] tracking-tight text-navy sm:text-[64px] xl:text-[76px]"
          >
            Claim your{" "}
            <DecodeText text="$MRT." className="font-bold text-compass" startDelay={400} />
          </motion.h1>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mt-6 max-w-lg font-sans text-lg leading-relaxed text-ledger"
          >
            {AIRDROP.claimAmount.toLocaleString("en-US")} MRT for every verified
            application — sent automatically from the treasury. Earn{" "}
            {AIRDROP.referralBonus} MRT more for every wallet that claims through
            your referral link.
          </motion.p>

          {/* Token facts */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={() => copy("contract", MRT_TOKEN.address)}
              className="group inline-flex items-center gap-2 rounded border border-grid bg-paper/80 px-3 py-2 font-mono text-[11px] text-navy backdrop-blur-sm transition-colors hover:border-compass"
              title="Copy contract address"
            >
              {MRT_TOKEN.symbol} · {shortAddress(MRT_TOKEN.address)}
              {copied === "contract" ? (
                <Check size={12} strokeWidth={2} className="text-compass" />
              ) : (
                <Copy size={12} strokeWidth={1.5} className="text-ledger group-hover:text-compass" />
              )}
            </button>
            <button onClick={addToken} className="btn-ghost !px-3 !py-2 !text-[12px]">
              <PlusCircle size={14} strokeWidth={1.5} />
              {tokenAdded ? "MRT added to wallet" : "Add MRT to wallet"}
            </button>
            <a
              href={`${BASE_CHAIN.explorer}/token/${MRT_TOKEN.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-1 font-mono text-[11px] tracking-wider text-ledger transition-colors hover:text-compass"
            >
              BASESCAN
              <ArrowUpRight size={12} strokeWidth={1.5} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* --------------------------- Claim console --------------------------- */}
      <section className="border-t border-grid bg-fog py-16 md:py-24">
        <div className="container-line grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Console window */}
          <Reveal>
            <div className="overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_24px_70px_-36px_rgba(29,37,84,0.35)]">
              {/* Window chrome */}
              <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
                <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger">
                  MRT://AIRDROP_CONSOLE
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-compass">
                  <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
                  BASE MAINNET
                </span>
              </div>

              {/* Success state replaces the form */}
              {result || alreadyClaimed ? (
                <div className="p-6 md:p-10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-compass/40 bg-compass/10">
                      <Check size={18} strokeWidth={2} className="text-compass" />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl text-navy">
                        {result ? "Application approved." : "Already claimed."}
                      </h2>
                      <p className="font-mono text-[11px] tracking-wider text-ledger">
                        {result
                          ? `${AIRDROP.claimAmount.toLocaleString("en-US")} MRT SENT TO ${shortAddress(address!)}`
                          : `THIS WALLET HAS ALREADY RECEIVED ITS ${AIRDROP.claimAmount.toLocaleString("en-US")} MRT`}
                      </p>
                    </div>
                  </div>

                  {(result?.txHash || alreadyClaimed?.txHash) && (
                    <a
                      href={`${BASE_CHAIN.explorer}/tx/${result?.txHash || alreadyClaimed?.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="arrow-link mt-6 inline-flex font-mono text-[12px]"
                    >
                      VIEW TRANSACTION ON BASESCAN
                      <ArrowUpRight size={14} strokeWidth={1.75} />
                    </a>
                  )}

                  {typeof alreadyClaimed?.referrals === "number" && (
                    <p className="mt-4 font-mono text-[11px] tracking-wider text-ledger">
                      REFERRALS: {alreadyClaimed.referrals} · EARNED +
                      {alreadyClaimed.referralEarned} MRT
                    </p>
                  )}

                  {myReferralLink && (
                    <div className="mt-8 rounded border border-grid bg-fog p-5">
                      <p className={STEP_LABEL}>
                        YOUR REFERRAL LINK · +{AIRDROP.referralBonus} MRT PER CLAIM
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

                  <button onClick={addToken} className="btn-ghost mt-6 !px-4 !py-2.5 !text-[12px]">
                    <PlusCircle size={14} strokeWidth={1.5} />
                    {tokenAdded ? "MRT added to wallet" : "Add MRT to your wallet"}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-grid">
                  {/* STEP 01 — WALLET */}
                  <div className="p-6 md:p-8">
                    <p className={STEP_LABEL}>STEP 01 — WALLET</p>
                    <div className="mt-4 flex gap-2">
                      {(
                        [
                          ["connect", "Connect MetaMask"],
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
                        connected ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded border border-compass/40 bg-compass/5 px-3 py-2.5 font-mono text-[12px] text-compass">
                              <span className="h-1.5 w-1.5 rounded-full bg-compass" />
                              {shortAddress(connected)} · CONNECTED
                            </span>
                            <button
                              onClick={() => setConnected(null)}
                              className="font-mono text-[10px] tracking-wider text-ledger underline-offset-2 hover:text-navy hover:underline"
                            >
                              DISCONNECT
                            </button>
                          </div>
                        ) : (
                          <button onClick={connect} className="btn-primary">
                            <Wallet size={16} strokeWidth={1.75} />
                            Connect MetaMask
                          </button>
                        )
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
                      {walletError && (
                        <p className="mt-3 flex items-center gap-1.5 font-sans text-xs text-coral">
                          <XCircle size={13} strokeWidth={1.5} />
                          {walletError}
                        </p>
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
                        <div key={task.id} className="flex items-center gap-4 py-4">
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
                            Broadcasting transfer…
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
                            ? `${AIRDROP.claimAmount.toLocaleString("en-US")} MRT → ${shortAddress(address!)}`
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
          <div className="space-y-6">
            <Reveal index={1}>
              <div className="rounded border border-grid bg-paper p-6">
                <p className="eyebrow mb-5">HOW IT WORKS</p>
                <ol className="space-y-5">
                  {[
                    ["01", "Set your wallet", "Connect MetaMask or paste any Base address — no signature required."],
                    ["02", "Complete the tasks", "Follow, post, join, read. Four clicks, one minute."],
                    ["03", "Submit", `The treasury sends ${AIRDROP.claimAmount.toLocaleString("en-US")} MRT to your wallet automatically — no gas needed on your side.`],
                    ["04", "Refer", `Share your link. Every referred claim pays you +${AIRDROP.referralBonus} MRT, instantly.`],
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
              <div className="rounded border border-grid bg-paper p-6">
                <p className="eyebrow mb-4">DISTRIBUTION RULES</p>
                <ul className="space-y-2.5 font-mono text-[11px] leading-relaxed tracking-wide text-ledger">
                  <li>· ONE CLAIM PER WALLET</li>
                  <li>· {AIRDROP.claimAmount.toLocaleString("en-US")} MRT PER APPROVED APPLICATION</li>
                  <li>· +{AIRDROP.referralBonus} MRT PER REFERRED CLAIM</li>
                  <li>· SETTLED ON BASE · CHAIN 8453</li>
                  <li>· SENT FROM THE PROTOCOL TREASURY</li>
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
