"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck, Check, Loader2, Scale, XCircle } from "lucide-react";
import { useAccount } from "wagmi";
import ConnectWallet from "./ConnectWallet";
import { shortAddress } from "@/lib/airdrop";
import type { EscrowAgent } from "@/lib/appSeed";

export default function EscrowClient({ agents }: { agents: EscrowAgent[] }) {
  const { address, isConnected } = useAccount();

  const [alias, setAlias] = useState("");
  const [feePct, setFeePct] = useState("1.0");
  const [specialties, setSpecialties] = useState("");
  const [contact, setContact] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (e: FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/app/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias,
          wallet: address,
          feePct: Number(feePct),
          specialties,
          contact,
          bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const input =
    "h-10 w-full rounded border border-grid bg-paper px-3 font-sans text-sm text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      {/* Agent directory */}
      <div className="min-w-0 space-y-4">
        {agents.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-grid bg-paper p-5 transition-colors hover:border-compass/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Scale size={16} strokeWidth={1.5} className="text-compass" />
                <span className="font-display text-lg text-navy">{a.alias}</span>
                <BadgeCheck size={15} strokeWidth={1.75} className="text-compass" />
              </div>
              <span className="font-mono text-[11px] text-ledger">
                {shortAddress(a.wallet)}
              </span>
            </div>
            <p className="mt-2.5 font-sans text-xs leading-relaxed text-ledger">{a.bio}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-grid pt-3.5 font-mono text-[10px] tracking-wider">
              <span className="text-navy">FEE {a.feePct.toFixed(1)}%</span>
              <span className="text-navy">{a.casesResolved} CASES</span>
              <span className="text-ledger">{a.specialties.join(" · ").toUpperCase()}</span>
              <span className="ml-auto text-compass">{a.contact}</span>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="rounded-lg border border-grid bg-paper p-8 text-center font-sans text-sm text-ledger">
            No approved escrow agents yet — be the first to register.
          </p>
        )}
      </div>

      {/* Register + how it works */}
      <div className="min-w-0 space-y-6">
        <div className="overflow-hidden rounded-lg border border-grid bg-paper">
          <div className="border-b border-grid bg-fog px-5 py-3">
            <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
              MRT://ESCROW_REGISTRATION
            </span>
          </div>
          {done ? (
            <div className="p-6">
              <p className="flex items-center gap-2 font-display text-lg text-navy">
                <Check size={18} strokeWidth={2} className="text-compass" />
                Application received.
              </p>
              <p className="mt-2 font-sans text-xs leading-relaxed text-ledger">
                Your registration is pending review. Once approved, your profile
                appears in the public directory and you can take escrow cases.
              </p>
            </div>
          ) : !isConnected ? (
            <div className="p-6">
              <p className="font-sans text-xs leading-relaxed text-ledger">
                Connect the wallet you will arbitrate with — it becomes your
                onchain escrow identity.
              </p>
              <div className="mt-4">
                <ConnectWallet />
              </div>
            </div>
          ) : (
            <form onSubmit={register} className="space-y-4 p-6">
              <p className="font-mono text-[10px] tracking-wider text-compass">
                WALLET: {address ? shortAddress(address) : ""}
              </p>
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Alias / display name"
                required
                className={input}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={feePct}
                  onChange={(e) => setFeePct(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Fee % (0–10)"
                  required
                  className={input}
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Contact (@telegram / email)"
                  required
                  className={input}
                />
              </div>
              <input
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="Specialties, comma separated"
                className={input}
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio — experience, process, response time"
                rows={3}
                className="w-full rounded border border-grid bg-paper px-3 py-2.5 font-sans text-sm text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 size={15} strokeWidth={1.75} className="animate-spin" />
                ) : (
                  "Register as escrow agent"
                )}
              </button>
              {error && (
                <p className="flex items-center gap-1.5 font-sans text-xs text-coral">
                  <XCircle size={13} strokeWidth={1.5} />
                  {error}
                </p>
              )}
            </form>
          )}
        </div>

        <div className="rounded-lg border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">HOW ESCROW WORKS</p>
          <ol className="space-y-3.5">
            {[
              ["01", "Two parties pick an agent from the directory and agree the fee."],
              ["02", "Funds lock in a 2-of-3 escrow contract: buyer, seller, agent."],
              ["03", "On dispute, the agent reviews evidence and co-signs the release."],
            ].map(([n, t]) => (
              <li key={n} className="flex gap-3">
                <span className="font-mono text-[10px] text-compass">{n}</span>
                <span className="font-sans text-xs leading-relaxed text-ledger">{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-grid pt-3.5 font-mono text-[9px] tracking-eyebrow text-ledger">
            ESCROW FACTORY CONTRACT — IN AUDIT, ADDRESSES SOON
          </p>
        </div>
      </div>
    </div>
  );
}
