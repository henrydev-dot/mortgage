"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BedDouble,
  Crown,
  Hammer,
  Landmark,
  Loader2,
  LogOut,
  ShoppingCart,
  Sparkles,
  Tag,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useSignMessage, useWriteContract } from "wagmi";
import ConnectWallet from "@/components/dapp/ConnectWallet";
import { MRT_TOKEN, shortAddress } from "@/lib/airdrop";
import type { AppConfig } from "@/lib/appSeed";
import {
  DISTRICTS,
  LOGIN_MESSAGE,
  MIN_WITHDRAW,
  TIERS,
  dailyNet,
  districtOf,
  nightlyBase,
  renovateCost,
  upgradeCost,
} from "@/lib/game/config";
import GameBoard, { type BoardLot } from "./GameBoard";

interface Me {
  address: string;
  balance: number;
  netWorth: number;
  deposited: number;
  withdrawn: number;
  pendingWithdrawals: { id: string; amount: number }[];
}

interface GameStateView {
  lots: BoardLot[];
  heat: Record<string, number>;
  events: { ts: number; text: string }[];
  leaderboard: { address: string; netWorth: number; lots: number }[];
  me: Me | null;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const panelCls = "rounded-lg border border-paper/10 bg-[#141b42]";
const btnP =
  "inline-flex items-center justify-center gap-2 rounded bg-compass px-4 py-2.5 font-sans text-[13px] font-medium text-paper transition-colors hover:bg-[#1d4585] disabled:cursor-not-allowed disabled:opacity-40";
const btnG =
  "inline-flex items-center justify-center gap-2 rounded border border-paper/20 px-4 py-2.5 font-sans text-[13px] font-medium text-paper/90 transition-colors hover:border-compass hover:text-paper disabled:opacity-40";
const inputCls =
  "h-10 w-full rounded border border-paper/15 bg-[#0e1434] px-3 font-mono text-[13px] text-paper placeholder:text-paper/30 focus:border-compass focus:outline-none";

export default function GameClient() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  const [state, setState] = useState<GameStateView | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"feed" | "top">("feed");
  const [modal, setModal] = useState<"deposit" | "withdraw" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/game/state", { cache: "no-store" });
      const data = await res.json();
      setState(data);
    } catch {
      /* keep last */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const flash = (ok: string | null, err: string | null) => {
    setNotice(ok);
    setError(err);
    setTimeout(() => {
      setNotice(null);
      setError(null);
    }, 4000);
  };

  /* ------------------------------- auth ------------------------------- */

  const signIn = async () => {
    if (!address) return;
    setBusy("signin");
    try {
      const signature = await signMessageAsync({ message: LOGIN_MESSAGE(address) });
      const res = await fetch("/api/game/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      const data = await res.json();
      if (!res.ok) flash(null, data.error || "Sign-in failed.");
      else await load();
    } catch {
      flash(null, "Signature rejected.");
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    await fetch("/api/game/auth", { method: "DELETE" }).catch(() => {});
    await load();
  };

  /* ------------------------------ actions ----------------------------- */

  const act = async (action: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await res.json();
      if (!res.ok) flash(null, data.error || "Action failed.");
      else await load();
    } catch {
      flash(null, "Network error.");
    } finally {
      setBusy(null);
    }
  };

  const me = state?.me ?? null;
  const lot = useMemo(
    () => state?.lots.find((l) => l.id === selected) ?? null,
    [state, selected]
  );

  /* ------------------------------- render ------------------------------ */

  return (
    <div className="min-h-screen bg-[#0e1434] text-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-paper/10 bg-[#10173a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-3 px-4">
          <Link href="/app" className="flex items-center gap-2.5">
            <img src="/brand/mark.svg" alt="" className="h-7 w-7" />
            <span className="hidden font-display text-sm text-paper sm:block">
              Mortgage <span className="text-[#7fa8e0]">Tycoon</span>
            </span>
            <span className="rounded border border-coral/50 bg-coral/10 px-1.5 py-0.5 font-mono text-[8px] tracking-eyebrow text-coral">
              BETA
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {me && (
              <>
                <span className="hidden items-center gap-2 rounded border border-paper/15 bg-[#141b42] px-3 py-1.5 font-mono text-[12px] sm:flex">
                  <span className="text-[#ffd97a]">◆</span>
                  {fmt(me.balance)} <span className="text-paper/50">MRT</span>
                </span>
                <button onClick={() => setModal("deposit")} className={`${btnG} !px-3 !py-1.5 !text-[11px]`}>
                  <ArrowDownToLine size={13} strokeWidth={1.75} />
                  <span className="hidden md:inline">Deposit</span>
                </button>
                <button onClick={() => setModal("withdraw")} className={`${btnG} !px-3 !py-1.5 !text-[11px]`}>
                  <ArrowUpFromLine size={13} strokeWidth={1.75} />
                  <span className="hidden md:inline">Withdraw</span>
                </button>
                <button onClick={signOut} aria-label="Sign out" className="p-1.5 text-paper/50 hover:text-paper">
                  <LogOut size={15} strokeWidth={1.5} />
                </button>
              </>
            )}
            <ConnectWallet compact />
          </div>
        </div>
      </header>

      {(error || notice) && (
        <div
          className={`mx-auto mt-3 max-w-[1360px] px-4`}
        >
          <p
            className={`rounded border px-4 py-2.5 font-sans text-sm ${
              error ? "border-coral/50 bg-coral/10 text-coral" : "border-compass/50 bg-compass/10 text-[#9cc0f5]"
            }`}
          >
            {error || notice}
          </p>
        </div>
      )}

      <main className="mx-auto grid max-w-[1360px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Board */}
        <div className="min-w-0">
          {!me && (
            <div className={`${panelCls} mb-6 p-6`}>
              <h1 className="font-display text-2xl text-paper">
                Build your empire, one block at a time.
              </h1>
              <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-paper/60">
                Buy pixel real estate across 8 districts, list it on Airbnb for
                nightly MRT income, renovate, upgrade to towers, and flip on
                the marketplace. District prices move with demand — buy where
                the city is heating up. 1 game day = 1 real hour, and your
                empire keeps earning while you&apos;re away.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <button onClick={signIn} disabled={busy === "signin"} className={btnP}>
                    {busy === "signin" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Sparkles size={15} strokeWidth={1.75} />
                    )}
                    Sign in & claim 25,000 MRT starter credit
                  </button>
                )}
                <span className="font-mono text-[10px] tracking-eyebrow text-paper/40">
                  GASLESS · WALLET-SIGNED · REAL MRT DEPOSITS OPTIONAL
                </span>
              </div>
            </div>
          )}

          {state ? (
            <GameBoard
              lots={state.lots}
              me={me?.address ?? null}
              selected={selected}
              onSelect={setSelected}
              heat={state.heat}
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <Loader2 size={24} className="animate-spin text-paper/40" />
            </div>
          )}

          {/* District legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {DISTRICTS.map((d) => (
              <span key={d.id} className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-paper/60">
                <span className="h-2 w-2" style={{ background: d.color }} />
                {d.name.toUpperCase()}
                <span className="text-paper/35">
                  ×{(state?.heat[d.id] ?? 1).toFixed(2)}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="min-w-0 space-y-4">
          {/* Selected lot */}
          <div className={`${panelCls} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-paper/10 bg-[#10173a] px-4 py-2.5">
              <span className="font-mono text-[9px] tracking-eyebrow text-paper/50">
                {lot ? `LOT #${String(lot.id).padStart(2, "0")}` : "SELECT A LOT"}
              </span>
              {lot && (
                <span
                  className="rounded px-2 py-0.5 font-mono text-[9px] tracking-eyebrow"
                  style={{ background: `${districtOf(lot.district).color}33`, color: districtOf(lot.district).color }}
                >
                  {districtOf(lot.district).name.toUpperCase()}
                </span>
              )}
            </div>

            {!lot ? (
              <p className="p-5 font-sans text-sm leading-relaxed text-paper/50">
                Click any building on the board to inspect it — price, owner,
                Airbnb income, and available actions appear here.
              </p>
            ) : (
              <LotPanel
                lot={lot}
                heat={state?.heat[lot.district] ?? 1}
                me={me}
                busy={busy}
                act={act}
              />
            )}
          </div>

          {/* My stats */}
          {me && (
            <div className={`${panelCls} p-4`}>
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div>
                  <p className="text-[9px] tracking-eyebrow text-paper/40">BALANCE</p>
                  <p className="mt-1 text-[15px] text-paper">{fmt(me.balance)}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-eyebrow text-paper/40">NET WORTH</p>
                  <p className="mt-1 text-[15px] text-[#7fa8e0]">{fmt(me.netWorth)}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-eyebrow text-paper/40">PROPERTIES</p>
                  <p className="mt-1 text-[15px] text-paper">
                    {state?.lots.filter((l) => l.owner === me.address).length ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feed / leaderboard */}
          <div className={`${panelCls} overflow-hidden`}>
            <div className="flex border-b border-paper/10">
              {(
                [
                  ["feed", "CITY FEED"],
                  ["top", "LEADERBOARD"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 px-4 py-2.5 font-mono text-[9px] tracking-eyebrow transition-colors ${
                    tab === key ? "bg-[#10173a] text-[#7fa8e0]" : "text-paper/40 hover:text-paper/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {tab === "feed" ? (
                <ul className="divide-y divide-paper/5">
                  {(state?.events ?? []).map((e, i) => (
                    <li key={`${e.ts}-${i}`} className="px-4 py-2.5">
                      <p className="font-sans text-[12px] leading-relaxed text-paper/70">{e.text}</p>
                      <p className="mt-0.5 font-mono text-[9px] text-paper/30">
                        {new Date(e.ts).toLocaleTimeString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-paper/5">
                  {(state?.leaderboard ?? []).map((p, i) => (
                    <li key={p.address} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={`font-mono text-[11px] ${i === 0 ? "text-[#ffd97a]" : "text-paper/40"}`}>
                        {i === 0 ? <Trophy size={13} /> : `#${i + 1}`}
                      </span>
                      <span className="flex-1 font-mono text-[12px] text-paper/80">
                        {shortAddress(p.address)}
                        {me?.address === p.address && (
                          <span className="ml-1.5 text-coral">(you)</span>
                        )}
                      </span>
                      <span className="font-mono text-[12px] text-[#7fa8e0]">{fmt(p.netWorth)}</span>
                      <span className="font-mono text-[10px] text-paper/40">{p.lots} lots</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {modal && me && (
        <WalletModal
          kind={modal}
          me={me}
          onClose={() => setModal(null)}
          onDone={async (msg) => {
            setModal(null);
            flash(msg, null);
            await load();
          }}
          onError={(msg) => flash(null, msg)}
          writeContractAsync={writeContractAsync}
        />
      )}

      <footer className="border-t border-paper/10 py-4">
        <p className="text-center font-mono text-[9px] tracking-eyebrow text-paper/30">
          MORTGAGE TYCOON BETA · IN-GAME BALANCES ARE GAME CREDITS · DEPOSITS SETTLE ON BASE
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------- lot panel -------------------------------- */

function LotPanel({
  lot,
  heat,
  me,
  busy,
  act,
}: {
  lot: BoardLot;
  heat: number;
  me: Me | null;
  busy: string | null;
  act: (action: Record<string, unknown>, label: string) => Promise<void>;
}) {
  const d = districtOf(lot.district);
  const [nightly, setNightly] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    setNightly(String(nightlyBase(d.baseCost, lot.tier, heat)));
    setPrice(String(lot.value));
  }, [lot.id, lot.tier, heat, d.baseCost, lot.value]);

  const mine = me && lot.owner === me.address;
  const projected = dailyNet(Number(nightly) || 0, d.baseCost, lot.tier, heat, lot.condition);
  const upCost = upgradeCost(d.baseCost, lot.tier);
  const renCost = renovateCost(d.baseCost, lot.condition);

  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-paper">{lot.name}</h2>
        <span className="font-mono text-[10px] text-paper/40">{TIERS[lot.tier].toUpperCase()}</span>
      </div>

      <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <dt className="text-paper/40">VALUE</dt>
          <dd className="text-paper">{lot.value.toLocaleString("en-US")} MRT</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-paper/40">DISTRICT HEAT</dt>
          <dd className={heat >= 1.15 ? "text-coral" : heat <= 0.9 ? "text-[#7fa8e0]" : "text-paper"}>
            ×{heat.toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-paper/40">CONDITION</dt>
          <dd className={lot.condition < 60 ? "text-coral" : "text-paper"}>{Math.round(lot.condition)}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-paper/40">OWNER</dt>
          <dd className="text-paper">
            {lot.owner ? (mine ? "YOU" : shortAddress(lot.owner)) : "BANK"}
          </dd>
        </div>
        {lot.nightly && (
          <div className="flex justify-between">
            <dt className="text-paper/40">AIRBNB</dt>
            <dd className="text-coral">{lot.nightly.toLocaleString("en-US")} MRT/NIGHT</dd>
          </div>
        )}
        {lot.earnedTotal > 0 && (
          <div className="flex justify-between">
            <dt className="text-paper/40">LIFETIME EARNINGS</dt>
            <dd className="text-[#7fa8e0]">{Math.round(lot.earnedTotal).toLocaleString("en-US")} MRT</dd>
          </div>
        )}
      </dl>

      {!me ? (
        <p className="mt-4 font-mono text-[10px] tracking-eyebrow text-paper/40">
          SIGN IN TO TRADE THIS LOT
        </p>
      ) : !lot.owner ? (
        <button
          onClick={() => act({ type: "buy", tileId: lot.id }, "buy")}
          disabled={busy !== null || me.balance < lot.value}
          className={`${btnP} mt-4 w-full`}
        >
          {busy === "buy" ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} strokeWidth={1.75} />}
          Buy for {lot.value.toLocaleString("en-US")} MRT
        </button>
      ) : lot.salePrice && !mine ? (
        <button
          onClick={() => act({ type: "buy_market", tileId: lot.id }, "buym")}
          disabled={busy !== null || me.balance < lot.salePrice}
          className={`${btnP} mt-4 w-full`}
        >
          {busy === "buym" ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} strokeWidth={1.75} />}
          Buy from owner — {lot.salePrice.toLocaleString("en-US")} MRT
        </button>
      ) : mine ? (
        <div className="mt-4 space-y-4">
          {/* Airbnb */}
          <div className="rounded border border-paper/10 bg-[#10173a] p-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-paper/50">
              <BedDouble size={11} strokeWidth={1.75} className="text-coral" />
              AIRBNB
            </p>
            {lot.nightly ? (
              <button
                onClick={() => act({ type: "airbnb_unlist", tileId: lot.id }, "unlist")}
                disabled={busy !== null}
                className={`${btnG} w-full !py-2 !text-[12px]`}
              >
                Unlist ({lot.nightly.toLocaleString("en-US")} MRT/night)
              </button>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={nightly}
                    onChange={(e) => setNightly(e.target.value.replace(/[^0-9]/g, ""))}
                    className={inputCls}
                    placeholder="Nightly MRT"
                  />
                  <button
                    onClick={() =>
                      act({ type: "airbnb_list", tileId: lot.id, nightly: Number(nightly) }, "list")
                    }
                    disabled={busy !== null}
                    className={`${btnP} shrink-0 !py-2 !text-[12px]`}
                  >
                    {busy === "list" ? <Loader2 size={13} className="animate-spin" /> : "List"}
                  </button>
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-paper/40">
                  EST. {Math.round(projected.occ * 100)}% OCCUPANCY ·{" "}
                  <span className={projected.net >= 0 ? "text-[#7fa8e0]" : "text-coral"}>
                    {projected.net >= 0 ? "+" : ""}
                    {Math.round(projected.net).toLocaleString("en-US")} MRT/DAY NET
                  </span>
                  <br />
                  AFTER CLEANING + MAINTENANCE
                </p>
              </>
            )}
          </div>

          {/* Maintain / upgrade */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => act({ type: "renovate", tileId: lot.id }, "ren")}
              disabled={busy !== null || lot.condition >= 100 || me.balance < renCost}
              className={`${btnG} !py-2 !text-[11px]`}
              title={`Restore condition to 100% for ${fmtNum(renCost)} MRT`}
            >
              <Hammer size={12} strokeWidth={1.75} />
              Renovate {lot.condition < 100 ? `· ${fmtNum(renCost)}` : ""}
            </button>
            <button
              onClick={() => act({ type: "upgrade", tileId: lot.id }, "up")}
              disabled={busy !== null || !Number.isFinite(upCost) || me.balance < (upCost as number)}
              className={`${btnG} !py-2 !text-[11px]`}
              title={Number.isFinite(upCost) ? `Upgrade to ${TIERS[lot.tier + 1]}` : "Max tier"}
            >
              <Crown size={12} strokeWidth={1.75} />
              {Number.isFinite(upCost) ? `Upgrade · ${fmtNum(upCost as number)}` : "Max tier"}
            </button>
          </div>

          {/* Sell */}
          <div className="rounded border border-paper/10 bg-[#10173a] p-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-paper/50">
              <Tag size={11} strokeWidth={1.75} className="text-[#ffd97a]" />
              SELL
            </p>
            {lot.salePrice ? (
              <button
                onClick={() => act({ type: "sell_cancel", tileId: lot.id }, "cancel")}
                disabled={busy !== null}
                className={`${btnG} w-full !py-2 !text-[12px]`}
              >
                Cancel listing ({lot.salePrice.toLocaleString("en-US")} MRT)
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  className={inputCls}
                  placeholder="Asking price"
                />
                <button
                  onClick={() => act({ type: "sell_list", tileId: lot.id, price: Number(price) }, "sell")}
                  disabled={busy !== null}
                  className={`${btnP} shrink-0 !py-2 !text-[12px]`}
                >
                  List
                </button>
              </div>
            )}
            <button
              onClick={() => act({ type: "bank_sell", tileId: lot.id }, "bank")}
              disabled={busy !== null}
              className={`${btnG} mt-2 w-full !py-2 !text-[11px]`}
            >
              <Landmark size={12} strokeWidth={1.75} />
              Instant sell to bank · {fmtNum(Math.round(lot.value * 0.7))} MRT
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 font-mono text-[10px] tracking-eyebrow text-paper/40">
          OWNED BY {shortAddress(lot.owner!)} — NOT FOR SALE
        </p>
      )}
    </div>
  );
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

/* ------------------------------ wallet modal ------------------------------- */

function WalletModal({
  kind,
  me,
  onClose,
  onDone,
  onError,
  writeContractAsync,
}: {
  kind: "deposit" | "withdraw";
  me: Me;
  onClose: () => void;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
  writeContractAsync: ReturnType<typeof useWriteContract>["writeContractAsync"];
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch("/api/app/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setConfig(d.config))
      .catch(() => {});
  }, []);

  const deposit = async () => {
    const value = Math.floor(Number(amount));
    if (!config?.treasuryAddress || !Number.isFinite(value) || value < 1) {
      onError("Enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      const hash = await writeContractAsync({
        address: MRT_TOKEN.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [config.treasuryAddress as `0x${string}`, parseUnits(String(value), MRT_TOKEN.decimals)],
      });
      // give the RPC a moment, then credit
      for (let attempt = 0; attempt < 6; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch("/api/game/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash }),
        });
        const data = await res.json();
        if (res.ok) {
          onDone(`Deposited ${data.credited.toLocaleString("en-US")} MRT into your game balance.`);
          return;
        }
        if (res.status !== 400) {
          onError(data.error || "Deposit failed.");
          return;
        }
      }
      onError("Tx sent but not confirmed yet — it will credit when you retry with the same tx.");
    } catch {
      onError("Transaction rejected.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    const value = Math.floor(Number(amount));
    setBusy(true);
    try {
      const res = await fetch("/api/game/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      const data = await res.json();
      if (!res.ok) onError(data.error || "Withdrawal failed.");
      else onDone(`Withdrawal of ${value.toLocaleString("en-US")} MRT requested — the team pays out to your wallet.`);
    } catch {
      onError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-lg border border-paper/15 bg-[#141b42]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-paper/10 bg-[#10173a] px-4 py-2.5">
          <span className="font-mono text-[9px] tracking-eyebrow text-paper/50">
            {kind === "deposit" ? "MRT://DEPOSIT" : "MRT://WITHDRAW"}
          </span>
          <button onClick={onClose} aria-label="Close" className="text-paper/50 hover:text-paper">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-5">
          {kind === "deposit" ? (
            <p className="font-sans text-xs leading-relaxed text-paper/60">
              Send real MRT from your wallet to the game treasury — it is
              verified onchain and credited 1:1 to your game balance.
            </p>
          ) : (
            <p className="font-sans text-xs leading-relaxed text-paper/60">
              Request a payout of game MRT to your wallet (min{" "}
              {MIN_WITHDRAW.toLocaleString("en-US")}). The team reviews and
              sends from the treasury.
              {me.pendingWithdrawals.length > 0 && (
                <span className="mt-1 block text-[#ffd97a]">
                  Pending: {me.pendingWithdrawals.map((w) => w.amount.toLocaleString("en-US")).join(", ")} MRT
                </span>
              )}
            </p>
          )}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Amount (MRT)"
            className={`${inputCls} mt-4`}
          />
          <button
            onClick={kind === "deposit" ? deposit : withdraw}
            disabled={busy}
            className={`${btnP} mt-3 w-full`}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : kind === "deposit" ? (
              <ArrowDownToLine size={14} strokeWidth={1.75} />
            ) : (
              <ArrowUpFromLine size={14} strokeWidth={1.75} />
            )}
            {kind === "deposit" ? "Send & credit" : "Request withdrawal"}
          </button>
          {kind === "deposit" && (
            <p className="mt-3 font-mono text-[9px] leading-relaxed tracking-wider text-paper/30">
              TREASURY: {config?.treasuryAddress ? shortAddress(config.treasuryAddress) : "—"} · BASE MAINNET
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
