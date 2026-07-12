"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Coins, Gamepad2, Loader2, RotateCcw, Users, XCircle } from "lucide-react";
import { shortAddress } from "@/lib/airdrop";

interface PlayerRow {
  address: string;
  balance: number;
  joinedAt: string;
  deposited: number;
  withdrawn: number;
}

interface WithdrawalRow {
  id: string;
  address: string;
  amount: number;
  status: "pending" | "paid" | "rejected";
  ts: string;
}

interface LotRow {
  id: number;
  district: string;
  name: string;
  tier: number;
  condition: number;
  owner: string | null;
  nightly: number | null;
  salePrice: number | null;
  earnedTotal: number;
}

interface Dump {
  players: PlayerRow[];
  withdrawals: WithdrawalRow[];
  heat: Record<string, number>;
  lots: LotRow[];
  depositCount: number;
}

const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const TIER_NAMES = ["House", "Villa", "Residence", "Tower"];

export default function GameAdmin() {
  const [data, setData] = useState<Dump | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});
  const [balanceEdit, setBalanceEdit] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetch("/api/game/admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => (d.error ? setState({ error: d.error }) : setData(d)))
      .catch(() => setState({ error: "Failed to load." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const op = async (key: string, body: Record<string, unknown>, okMsg: string) => {
    setBusy(key);
    setState({});
    try {
      const res = await fetch("/api/game/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) setState({ error: d.error || "Failed." });
      else {
        setState({ ok: okMsg });
        load();
      }
    } catch {
      setState({ error: "Network error." });
    } finally {
      setBusy(null);
    }
  };

  const pending = useMemo(
    () => (data?.withdrawals ?? []).filter((w) => w.status === "pending"),
    [data]
  );
  const processed = useMemo(
    () => (data?.withdrawals ?? []).filter((w) => w.status !== "pending").slice(0, 20),
    [data]
  );
  const ownedLots = useMemo(() => (data?.lots ?? []).filter((l) => l.owner), [data]);

  const input =
    "h-9 w-32 rounded border border-grid bg-paper px-2.5 font-mono text-[12px] text-navy focus:border-compass focus:outline-none";
  const card = "overflow-hidden rounded border border-grid bg-paper";
  const cardHead = "border-b border-grid bg-fog px-5 py-3 font-mono text-[9px] tracking-eyebrow text-ledger";

  if (loading) {
    return <p className="font-mono text-[11px] text-ledger">LOADING…</p>;
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">Tycoon Game</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Players, balances and withdrawal requests for the /game Mortgage Tycoon.
        Withdrawals are paid manually from the treasury wallet — mark them PAID
        after sending the MRT, or REJECT to refund the in-game balance.
      </p>

      {state.error && (
        <p className="mb-4 flex items-center gap-2 rounded border border-coral/40 bg-coral/5 px-4 py-2.5 font-mono text-[11px] text-coral">
          <XCircle size={13} strokeWidth={1.75} /> {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mb-4 flex items-center gap-2 rounded border border-compass/40 bg-compass/5 px-4 py-2.5 font-mono text-[11px] text-compass">
          <Check size={13} strokeWidth={1.75} /> {state.ok}
        </p>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "PLAYERS", value: fmt(data?.players.length ?? 0), icon: Users },
          { label: "OWNED LOTS", value: `${ownedLots.length} / ${data?.lots.length ?? 0}`, icon: Gamepad2 },
          { label: "DEPOSITS CREDITED", value: fmt(data?.depositCount ?? 0), icon: Coins },
          { label: "PENDING WITHDRAWALS", value: fmt(pending.length), icon: Loader2 },
        ].map((s) => (
          <div key={s.label} className="rounded border border-grid bg-paper p-4">
            <div className="mb-2 flex items-center gap-2">
              <s.icon size={13} strokeWidth={1.5} className="text-ledger" />
              <span className="font-mono text-[9px] tracking-eyebrow text-ledger">{s.label}</span>
            </div>
            <p className="font-display text-2xl text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending withdrawals */}
      <div className={`${card} mb-6`}>
        <div className={cardHead}>PENDING WITHDRAWALS ({pending.length})</div>
        {pending.length === 0 ? (
          <p className="p-5 font-mono text-[11px] text-ledger">Nothing waiting.</p>
        ) : (
          <ul className="divide-y divide-grid">
            {pending.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-[12px] text-navy">{w.address}</p>
                  <p className="font-mono text-[9px] tracking-wider text-ledger">
                    {new Date(w.ts).toLocaleString()} · {fmt(w.amount)} MRT
                  </p>
                </div>
                <button
                  disabled={busy === w.id}
                  onClick={() => op(w.id, { op: "withdrawal", id: w.id, status: "paid" }, `Marked ${fmt(w.amount)} MRT as paid.`)}
                  className="rounded border border-compass bg-compass px-3 py-1.5 font-mono text-[10px] tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  MARK PAID
                </button>
                <button
                  disabled={busy === w.id}
                  onClick={() => op(w.id, { op: "withdrawal", id: w.id, status: "rejected" }, "Withdrawal rejected and refunded.")}
                  className="rounded border border-coral px-3 py-1.5 font-mono text-[10px] tracking-wider text-coral transition-colors hover:bg-coral/5 disabled:opacity-50"
                >
                  REJECT
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Players */}
      <div className={`${card} mb-6`}>
        <div className={cardHead}>PLAYERS ({data?.players.length ?? 0})</div>
        {(data?.players.length ?? 0) === 0 ? (
          <p className="p-5 font-mono text-[11px] text-ledger">No players yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid font-mono text-[9px] tracking-eyebrow text-ledger">
                  <th className="px-5 py-2.5 font-medium">WALLET</th>
                  <th className="px-3 py-2.5 font-medium">BALANCE</th>
                  <th className="px-3 py-2.5 font-medium">DEPOSITED</th>
                  <th className="px-3 py-2.5 font-medium">WITHDRAWN</th>
                  <th className="px-3 py-2.5 font-medium">JOINED</th>
                  <th className="px-5 py-2.5 font-medium">SET BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid">
                {(data?.players ?? [])
                  .slice()
                  .sort((a, b) => b.balance - a.balance)
                  .map((p) => (
                    <tr key={p.address} className="font-mono text-[12px] text-navy">
                      <td className="px-5 py-3">{shortAddress(p.address)}</td>
                      <td className="px-3 py-3">{fmt(p.balance)}</td>
                      <td className="px-3 py-3 text-ledger">{fmt(p.deposited)}</td>
                      <td className="px-3 py-3 text-ledger">{fmt(p.withdrawn)}</td>
                      <td className="px-3 py-3 text-[10px] text-ledger">
                        {new Date(p.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            className={input}
                            inputMode="numeric"
                            placeholder={fmt(p.balance)}
                            value={balanceEdit[p.address] ?? ""}
                            onChange={(e) =>
                              setBalanceEdit((m) => ({ ...m, [p.address]: e.target.value }))
                            }
                          />
                          <button
                            disabled={busy === p.address || !(balanceEdit[p.address] ?? "").trim()}
                            onClick={() =>
                              op(
                                p.address,
                                { op: "set_balance", address: p.address, balance: Number(balanceEdit[p.address]) },
                                `Balance updated for ${shortAddress(p.address)}.`
                              ).then(() => setBalanceEdit((m) => ({ ...m, [p.address]: "" })))
                            }
                            className="rounded border border-grid px-2.5 py-1.5 font-mono text-[10px] tracking-wider text-navy/70 transition-colors hover:border-compass hover:text-compass disabled:opacity-40"
                          >
                            SET
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Owned lots */}
        <div className={card}>
          <div className={cardHead}>OWNED LOTS ({ownedLots.length})</div>
          {ownedLots.length === 0 ? (
            <p className="p-5 font-mono text-[11px] text-ledger">The whole city belongs to the bank.</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-grid overflow-y-auto">
              {ownedLots.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px] text-navy">
                      #{l.id} {l.name} · {TIER_NAMES[l.tier]}
                    </p>
                    <p className="font-mono text-[9px] tracking-wider text-ledger">
                      {shortAddress(l.owner!)} · COND {Math.round(l.condition)}%
                      {l.nightly ? ` · AIRBNB ${fmt(l.nightly)}/night` : ""}
                      {l.salePrice ? ` · FOR SALE ${fmt(l.salePrice)}` : ""}
                    </p>
                  </div>
                  <button
                    disabled={busy === `lot-${l.id}`}
                    onClick={() => {
                      if (!window.confirm(`Return #${l.id} ${l.name} to the bank? The owner is NOT refunded.`)) return;
                      op(`lot-${l.id}`, { op: "reset_lot", tileId: l.id }, `Lot #${l.id} returned to the bank.`);
                    }}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-coral underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    <RotateCcw size={11} strokeWidth={1.75} /> RESET
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Processed withdrawals */}
        <div className={card}>
          <div className={cardHead}>PROCESSED WITHDRAWALS</div>
          {processed.length === 0 ? (
            <p className="p-5 font-mono text-[11px] text-ledger">None yet.</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-grid overflow-y-auto">
              {processed.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-mono text-[12px] text-navy">
                      {shortAddress(w.address)} · {fmt(w.amount)} MRT
                    </p>
                    <p className="font-mono text-[9px] tracking-wider text-ledger">
                      {new Date(w.ts).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[9px] tracking-wider ${
                      w.status === "paid"
                        ? "border-compass/40 bg-compass/5 text-compass"
                        : "border-coral/40 bg-coral/5 text-coral"
                    }`}
                  >
                    {w.status.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
