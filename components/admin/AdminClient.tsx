"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Save, XCircle } from "lucide-react";
import type { EscrowAgent, StakePool } from "@/lib/appSeed";

/* ------------------------------ shared bits ------------------------------ */

function useAdminKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(sessionStorage.getItem("adminKey") || "");
  }, []);
  const update = (v: string) => {
    setKey(v);
    sessionStorage.setItem("adminKey", v);
  };
  return { key, update };
}

function KeyField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label className="font-mono text-[10px] tracking-eyebrow text-ledger">ADMIN KEY</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="leave empty if ADMIN_KEY is not set"
        className="h-9 w-72 rounded border border-grid bg-paper px-3 font-mono text-[12px] text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none"
      />
    </div>
  );
}

function StatusLine({ state }: { state: { ok?: string; error?: string } }) {
  if (state.error) {
    return (
      <p className="mt-3 flex items-center gap-1.5 font-sans text-sm text-coral">
        <XCircle size={14} strokeWidth={1.5} /> {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="mt-3 flex items-center gap-1.5 font-sans text-sm text-compass">
        <Check size={14} strokeWidth={1.75} /> {state.ok}
      </p>
    );
  }
  return null;
}

/* --------------------------- JSON collection editor --------------------------- */

export function JsonCollectionEditor({
  title,
  endpoint,
  field,
}: {
  title: string;
  endpoint: string; // e.g. /api/app/properties
  field: string; // e.g. "properties"
}) {
  const { key, update } = useAdminKey();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});

  useEffect(() => {
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setText(JSON.stringify(data[field], null, 2)))
      .catch(() => setState({ error: "Failed to load." }))
      .finally(() => setLoading(false));
  }, [endpoint, field]);

  const save = async () => {
    setSaving(true);
    setState({});
    try {
      const parsed = JSON.parse(text);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ [field]: parsed }),
      });
      const data = await res.json();
      if (!res.ok) setState({ error: data.error || "Save failed." });
      else setState({ ok: `Saved ${data.count} items.` });
    } catch (e) {
      setState({ error: e instanceof SyntaxError ? "Invalid JSON." : "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">{title}</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Edit the collection as JSON and save — changes go live immediately.
      </p>
      <KeyField value={key} onChange={update} />
      {loading ? (
        <p className="font-mono text-[11px] text-ledger">LOADING…</p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={28}
            className="w-full rounded border border-grid bg-paper p-4 font-mono text-[12px] leading-relaxed text-navy focus:border-compass focus:outline-none"
          />
          <button onClick={save} disabled={saving} className="btn-primary mt-4 disabled:opacity-40">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={1.75} />}
            Save collection
          </button>
          <StatusLine state={state} />
        </>
      )}
    </div>
  );
}

/* -------------------------------- pools editor ------------------------------- */

export function PoolsEditor() {
  const { key, update } = useAdminKey();
  const [pools, setPools] = useState<StakePool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});

  useEffect(() => {
    fetch("/api/app/pools", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPools(data.pools ?? []))
      .catch(() => setState({ error: "Failed to load." }))
      .finally(() => setLoading(false));
  }, []);

  const set = (i: number, patch: Partial<StakePool>) =>
    setPools((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const save = async () => {
    setSaving(true);
    setState({});
    try {
      const res = await fetch("/api/app/pools", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ pools }),
      });
      const data = await res.json();
      if (!res.ok) setState({ error: data.error || "Save failed." });
      else setState({ ok: "Pools saved." });
    } catch {
      setState({ error: "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;
  const input =
    "h-9 w-full rounded border border-grid bg-paper px-2.5 font-mono text-[12px] text-navy focus:border-compass focus:outline-none";

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">Stake Pools</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        APR, lock, minimum, TVL and the staking contract address — paste the
        contract when it deploys and the app shows it automatically.
      </p>
      <KeyField value={key} onChange={update} />
      {loading ? (
        <p className="font-mono text-[11px] text-ledger">LOADING…</p>
      ) : (
        <div className="space-y-6">
          {pools.map((p, i) => (
            <div key={p.id} className="rounded border border-grid bg-paper p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg text-navy">{p.name}</span>
                <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ledger">
                  ACTIVE
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => set(i, { active: e.target.checked })}
                    className="h-4 w-4 accent-[#275CAB]"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["APR %", String(p.apr), (v: string) => set(i, { apr: num(v) })],
                    ["LOCK DAYS", String(p.lockDays), (v: string) => set(i, { lockDays: num(v) })],
                    ["MIN STAKE", String(p.minStake), (v: string) => set(i, { minStake: num(v) })],
                    ["TVL (MRT)", String(p.tvlMrt), (v: string) => set(i, { tvlMrt: num(v) })],
                  ] as [string, string, (v: string) => void][]
                ).map(([label, value, onChange]) => (
                  <div key={label}>
                    <label className="mb-1 block font-mono text-[9px] tracking-eyebrow text-ledger">
                      {label}
                    </label>
                    <input value={value} onChange={(e) => onChange(e.target.value)} className={input} />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[9px] tracking-eyebrow text-ledger">
                    STAKING CONTRACT (0x…)
                  </label>
                  <input
                    value={p.contract}
                    onChange={(e) => set(i, { contract: e.target.value.trim() })}
                    placeholder="empty = in audit"
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] tracking-eyebrow text-ledger">
                    DESCRIPTION
                  </label>
                  <input
                    value={p.description}
                    onChange={(e) => set(i, { description: e.target.value })}
                    className={input}
                  />
                </div>
              </div>
            </div>
          ))}
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-40">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={1.75} />}
            Save pools
          </button>
          <StatusLine state={state} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------- escrow admin ------------------------------- */

export function EscrowAdmin() {
  const { key, update } = useAdminKey();
  const [agents, setAgents] = useState<EscrowAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});

  const load = useCallback(() => {
    fetch("/api/app/escrow?all=1", {
      cache: "no-store",
      headers: { "x-admin-key": sessionStorage.getItem("adminKey") || "" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setState({ error: data.error });
        else setAgents(data.agents ?? []);
      })
      .catch(() => setState({ error: "Failed to load." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: EscrowAgent["status"]) => {
    setState({});
    const res = await fetch("/api/app/escrow", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) setState({ error: data.error || "Update failed." });
    else {
      setState({ ok: `Set ${id} → ${status}.` });
      load();
    }
  };

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">Escrow Agents</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Approve or reject registrations — only approved agents appear in the
        public directory.
      </p>
      <KeyField value={key} onChange={update} />
      <StatusLine state={state} />
      {loading ? (
        <p className="mt-4 font-mono text-[11px] text-ledger">LOADING…</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded border border-grid bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid bg-fog font-mono text-[10px] uppercase tracking-wider text-ledger">
                  <th className="px-4 py-3">Alias</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid font-mono text-[12px] text-navy">
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">{a.alias}</td>
                    <td className="px-4 py-3">{a.wallet.slice(0, 10)}…</td>
                    <td className="px-4 py-3">{a.feePct}%</td>
                    <td className="px-4 py-3">{a.contact}</td>
                    <td
                      className={`px-4 py-3 ${
                        a.status === "approved"
                          ? "text-compass"
                          : a.status === "pending"
                            ? "text-coral"
                            : "text-ledger"
                      }`}
                    >
                      {a.status.toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => setStatus(a.id, "approved")}
                        className="mr-3 text-compass underline-offset-2 hover:underline"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => setStatus(a.id, "rejected")}
                        className="text-ledger underline-offset-2 hover:underline"
                      >
                        REJECT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
