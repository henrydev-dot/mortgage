"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, Loader2, Plus, Vote, X, XCircle } from "lucide-react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import ConnectWallet from "./ConnectWallet";
import { MRT_TOKEN, shortAddress } from "@/lib/airdrop";
import { proposalMessage, voteMessage } from "@/lib/daoMessages";
import { DAO_CONFIG } from "@/lib/appSeed";

interface ProposalView {
  id: string;
  title: string;
  summary: string;
  author: string;
  createdAt: string;
  endsAt: string;
  forVotes: number;
  againstVotes: number;
  status: "ACTIVE" | "PASSED" | "FAILED";
  voteCount: number;
  myVote: { support: boolean; weight: number } | null;
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function StatusChip({ status }: { status: ProposalView["status"] }) {
  if (status === "ACTIVE") {
    return (
      <span className="flex items-center gap-1.5 rounded border border-coral/40 px-2 py-0.5 font-mono text-[9px] tracking-eyebrow text-coral">
        <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
        ACTIVE
      </span>
    );
  }
  return (
    <span
      className={`rounded border px-2 py-0.5 font-mono text-[9px] tracking-eyebrow ${
        status === "PASSED" ? "border-compass/40 text-compass" : "border-grid text-ledger"
      }`}
    >
      {status}
    </span>
  );
}

export default function DaoClient() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // "MIP-3:for" etc.
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Proposal form
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  const { data: rawBalance } = useReadContract({
    address: MRT_TOKEN.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const balance =
    rawBalance !== undefined ? Number(formatUnits(rawBalance, MRT_TOKEN.decimals)) : null;
  const canPropose = (balance ?? 0) >= DAO_CONFIG.proposalThreshold;

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/app/dao${address ? `?address=${address}` : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setProposals(data.proposals ?? []);
    } catch {
      /* keep old list */
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  const vote = async (proposalId: string, support: boolean) => {
    if (!address) return;
    setBusy(`${proposalId}:${support ? "for" : "against"}`);
    setError(null);
    setNotice(null);
    try {
      const signature = await signMessageAsync({
        message: voteMessage(proposalId, support),
      });
      const res = await fetch("/api/app/dao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", proposalId, support, address, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Vote failed.");
        return;
      }
      setNotice(`Vote recorded — weight ${fmt(data.weight)} MRT.`);
      await load();
    } catch {
      setError("Signature rejected.");
    } finally {
      setBusy(null);
    }
  };

  const propose = async (e: FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setBusy("propose");
    setError(null);
    setNotice(null);
    try {
      const signature = await signMessageAsync({ message: proposalMessage(title.trim()) });
      const res = await fetch("/api/app/dao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose",
          title: title.trim(),
          summary: summary.trim(),
          address,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the proposal.");
        return;
      }
      setNotice(`Proposal ${data.id} created — voting is open for ${DAO_CONFIG.votingDays} days.`);
      setFormOpen(false);
      setTitle("");
      setSummary("");
      await load();
    } catch {
      setError("Signature rejected.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Proposals */}
      <div className="min-w-0 space-y-5">
        {(error || notice) && (
          <p
            className={`flex items-center gap-2 rounded border px-4 py-3 font-sans text-sm ${
              error ? "border-coral/40 bg-coral/5 text-coral" : "border-compass/40 bg-compass/5 text-compass"
            }`}
          >
            {error ? <XCircle size={15} strokeWidth={1.5} /> : <Check size={15} strokeWidth={1.75} />}
            {error || notice}
          </p>
        )}

        {loading ? (
          <p className="flex items-center gap-2 rounded-lg border border-grid bg-paper p-8 font-mono text-[11px] tracking-wider text-ledger">
            <Loader2 size={14} className="animate-spin" />
            LOADING PROPOSALS…
          </p>
        ) : (
          proposals.map((p) => {
            const total = p.forVotes + p.againstVotes;
            const forPct = total > 0 ? (p.forVotes / total) * 100 : 0;
            const quorumPct = Math.min(100, (total / DAO_CONFIG.quorum) * 100);
            const active = p.status === "ACTIVE";
            return (
              <div key={p.id} className="overflow-hidden rounded-lg border border-grid bg-paper">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grid bg-fog px-5 py-3">
                  <span className="font-mono text-[10px] tracking-eyebrow text-ledger">
                    {p.id} · BY {shortAddress(p.author)}
                  </span>
                  <StatusChip status={p.status} />
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg text-navy">{p.title}</h2>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-ledger">{p.summary}</p>

                  {/* Tally */}
                  <div className="mt-5">
                    <div className="flex justify-between font-mono text-[10px] tracking-wider">
                      <span className="text-compass">FOR {fmt(p.forVotes)}</span>
                      <span className="text-ledger">AGAINST {fmt(p.againstVotes)}</span>
                    </div>
                    <div className="mt-1.5 flex h-1 w-full overflow-hidden rounded-full bg-grid">
                      <div className="bg-compass" style={{ width: `${forPct}%` }} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap justify-between gap-2 font-mono text-[9px] tracking-eyebrow text-ledger">
                      <span>
                        QUORUM {quorumPct.toFixed(0)}% OF {fmt(DAO_CONFIG.quorum)} MRT
                      </span>
                      <span>
                        {active
                          ? `ENDS ${new Date(p.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : `ENDED ${new Date(p.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 border-t border-grid pt-4">
                    {p.myVote ? (
                      <p className="font-mono text-[10px] tracking-wider text-compass">
                        YOU VOTED {p.myVote.support ? "FOR" : "AGAINST"} · WEIGHT{" "}
                        {fmt(p.myVote.weight)} MRT
                      </p>
                    ) : active && isConnected ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => vote(p.id, true)}
                          disabled={busy !== null}
                          className="btn-primary flex-1 justify-center !py-2.5 !text-[12px] disabled:opacity-40"
                        >
                          {busy === `${p.id}:for` ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Vote size={13} strokeWidth={1.75} />
                          )}
                          Vote FOR
                        </button>
                        <button
                          onClick={() => vote(p.id, false)}
                          disabled={busy !== null}
                          className="btn-ghost flex-1 justify-center !bg-paper !py-2.5 !text-[12px] disabled:opacity-40"
                        >
                          {busy === `${p.id}:against` ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <X size={13} strokeWidth={1.75} />
                          )}
                          Vote AGAINST
                        </button>
                      </div>
                    ) : active ? (
                      <ConnectWallet compact />
                    ) : (
                      <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
                        VOTING CLOSED
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rail — power + create */}
      <div className="min-w-0 space-y-6">
        <div className="rounded-lg border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">YOUR VOTING POWER</p>
          {isConnected ? (
            <>
              <p className="font-mono text-2xl text-navy">
                {balance === null ? "—" : fmt(balance)}{" "}
                <span className="text-sm text-ledger">MRT</span>
              </p>
              <p className="mt-2 font-mono text-[9px] tracking-eyebrow text-ledger">
                1 MRT = 1 VOTE · SNAPSHOT AT VOTE TIME
              </p>
            </>
          ) : (
            <ConnectWallet compact />
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-grid bg-paper">
          <div className="border-b border-grid bg-fog px-5 py-3">
            <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
              MRT://NEW_PROPOSAL
            </span>
          </div>
          <div className="p-5">
            {!formOpen ? (
              <>
                <p className="font-sans text-xs leading-relaxed text-ledger">
                  Wallets holding{" "}
                  <span className="text-navy">
                    {DAO_CONFIG.proposalThreshold.toLocaleString("en-US")} MRT
                  </span>{" "}
                  can put a proposal to the DAO. Voting runs {DAO_CONFIG.votingDays} days.
                </p>
                <button
                  onClick={() => setFormOpen(true)}
                  disabled={!isConnected || !canPropose}
                  className="btn-primary mt-4 w-full justify-center !py-2.5 !text-[12px] disabled:opacity-40"
                  title={
                    !isConnected
                      ? "Connect a wallet first"
                      : !canPropose
                        ? `Requires ${DAO_CONFIG.proposalThreshold.toLocaleString("en-US")} MRT`
                        : undefined
                  }
                >
                  <Plus size={14} strokeWidth={1.75} />
                  New proposal
                </button>
                {isConnected && !canPropose && (
                  <p className="mt-2.5 text-center font-mono text-[9px] tracking-eyebrow text-ledger">
                    THRESHOLD NOT MET WITH THIS WALLET
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={propose} className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Proposal title"
                  required
                  minLength={8}
                  className="h-10 w-full rounded border border-grid bg-paper px-3 font-sans text-sm text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none"
                />
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="What should the DAO decide, and why?"
                  required
                  minLength={20}
                  rows={4}
                  className="w-full rounded border border-grid bg-paper px-3 py-2.5 font-sans text-sm text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy === "propose"}
                    className="btn-primary flex-1 justify-center !py-2.5 !text-[12px] disabled:opacity-40"
                  >
                    {busy === "propose" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Sign & submit"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="btn-ghost !bg-paper !px-4 !py-2.5 !text-[12px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">GOVERNANCE RULES</p>
          <ul className="space-y-2.5 font-mono text-[10px] leading-relaxed tracking-wide text-ledger">
            <li>· 1 MRT = 1 VOTE, WEIGHED AT VOTE TIME</li>
            <li>· VOTES ARE WALLET-SIGNED (GASLESS)</li>
            <li>· QUORUM {fmt(DAO_CONFIG.quorum)} MRT</li>
            <li>· PROPOSALS NEED {fmt(DAO_CONFIG.proposalThreshold)} MRT</li>
            <li>· ONCHAIN EXECUTION AFTER CONTRACTS SHIP</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
