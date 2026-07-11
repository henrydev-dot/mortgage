"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save, XCircle } from "lucide-react";
import type { AppConfig } from "@/lib/appSeed";

const input =
  "h-10 w-full rounded border border-grid bg-paper px-3 font-mono text-[12px] text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none";

export default function SettingsEditor() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});

  useEffect(() => {
    fetch("/api/app/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setConfig(d.config))
      .catch(() => setState({ error: "Failed to load." }));
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setState({});
    try {
      const res = await fetch("/api/app/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) setState({ error: data.error || "Save failed." });
      else setState({ ok: "Settings saved." });
    } catch {
      setState({ error: "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <p className="font-mono text-[11px] text-ledger">LOADING…</p>;

  const field = (
    label: string,
    key: keyof AppConfig,
    placeholder: string,
    numeric = false
  ) => (
    <div>
      <label className="mb-1 block font-mono text-[9px] tracking-eyebrow text-ledger">
        {label}
      </label>
      <input
        value={String(config[key] ?? "")}
        placeholder={placeholder}
        onChange={(e) =>
          setConfig({
            ...config,
            [key]: numeric
              ? Number(e.target.value.replace(/[^0-9.]/g, "")) || 0
              : e.target.value,
          })
        }
        className={input}
      />
    </div>
  );

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">App Settings</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Property reservation payments and deployed contract addresses. The
        treasury address receives USDT/ETH reservation payments directly from
        buyers&apos; wallets.
      </p>

      <div className="space-y-6">
        <div className="rounded border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">RESERVATION PAYMENTS</p>
          <div className="grid gap-4">
            {field("TREASURY ADDRESS (RECEIVES PAYMENTS)", "treasuryAddress", "0x… — empty disables reservations")}
            <div className="grid grid-cols-2 gap-4">
              {field("START AMOUNT — USDT", "startAmountUsdt", "100", true)}
              {field("START AMOUNT — ETH", "startAmountEth", "0.03", true)}
            </div>
            {field("USDT TOKEN CONTRACT (BASE)", "usdtAddress", "0xfde4…9bb2")}
          </div>
        </div>

        <div className="rounded border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">PROTOCOL CONTRACTS (PASTE AFTER DEPLOY)</p>
          <div className="grid gap-4">
            {field("STAKING CONTRACT", "stakingContract", "0x… — see contracts/MortgageStaking.sol")}
            {field("LENDING CONTRACT", "lendingContract", "0x… — see contracts/MortgageLending.sol")}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-40">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={1.75} />}
          Save settings
        </button>
        {state.error && (
          <p className="flex items-center gap-1.5 font-sans text-sm text-coral">
            <XCircle size={14} strokeWidth={1.5} /> {state.error}
          </p>
        )}
        {state.ok && (
          <p className="flex items-center gap-1.5 font-sans text-sm text-compass">
            <Check size={14} strokeWidth={1.75} /> {state.ok}
          </p>
        )}
      </div>
    </div>
  );
}
