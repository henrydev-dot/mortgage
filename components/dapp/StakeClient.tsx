"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Layers, Lock, PlusCircle } from "lucide-react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract, useWalletClient } from "wagmi";
import ConnectWallet from "./ConnectWallet";
import { BASE_CHAIN, MRT_TOKEN, metamaskDappLink, shortAddress } from "@/lib/airdrop";
import type { StakePool } from "@/lib/appSeed";

const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

function TokenCard() {
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const { data: walletClient } = useWalletClient();

  const copy = () => {
    navigator.clipboard?.writeText(MRT_TOKEN.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const addToken = async () => {
    if (!walletClient) {
      if (/android|iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { ethereum?: unknown }).ethereum) {
        window.location.href = metamaskDappLink();
      }
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
      if (ok) setAdded(true);
    } catch {
      /* declined */
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-grid bg-paper">
      <div className="flex items-center justify-between border-b border-grid bg-fog px-4 py-2.5">
        <span className="font-mono text-[9px] tracking-eyebrow text-ledger">MRT://TOKEN</span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-compass">
          <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
          BASE MAINNET
        </span>
      </div>
      <dl className="divide-y divide-grid">
        {(
          [
            ["NETWORK", `${BASE_CHAIN.name} · CHAIN ID ${BASE_CHAIN.id}`],
            ["CONTRACT", MRT_TOKEN.address],
            ["SYMBOL", MRT_TOKEN.symbol],
            ["DECIMALS", String(MRT_TOKEN.decimals)],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label} className="flex items-start gap-4 px-4 py-3">
            <dt className="w-20 shrink-0 pt-0.5 font-mono text-[9px] tracking-eyebrow text-ledger">
              {label}
            </dt>
            <dd className="flex min-w-0 flex-1 items-start justify-between gap-2 font-mono text-[11px] leading-relaxed text-navy">
              <span className="break-all">{value}</span>
              {label === "CONTRACT" && (
                <button onClick={copy} aria-label="Copy contract" className="shrink-0 pt-0.5 text-ledger hover:text-compass">
                  {copied ? (
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
      <div className="flex flex-wrap items-center gap-3 border-t border-grid bg-fog px-4 py-3.5">
        <button onClick={addToken} className="btn-ghost !bg-paper !px-3 !py-2 !text-[11px]">
          <PlusCircle size={13} strokeWidth={1.5} />
          {added ? "MRT added" : "Add MRT to wallet"}
        </button>
        <a
          href={`${BASE_CHAIN.explorer}/token/${MRT_TOKEN.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-ledger hover:text-compass"
        >
          BASESCAN
          <ArrowUpRight size={12} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}

function PoolCard({ pool, balance }: { pool: StakePool; balance: number | null }) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const parsed = Number(amount) || 0;
  const reward = (parsed * (pool.apr / 100) * pool.lockDays) / 365;
  const contractReady = pool.contract.length === 42;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-grid bg-paper">
      <div className="flex items-center justify-between border-b border-grid bg-fog px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Layers size={16} strokeWidth={1.5} className="text-compass" />
          <span className="font-display text-base text-navy">{pool.name}</span>
        </div>
        <span className="rounded border border-compass/40 bg-compass/5 px-2 py-0.5 font-mono text-[10px] text-compass">
          {pool.pair.join(" + ")}
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-grid border-b border-grid font-mono">
        {(
          [
            ["APR", `${pool.apr.toFixed(1)}%`],
            ["LOCK", `${pool.lockDays} DAYS`],
            ["TVL", `${fmt(pool.tvlMrt / 1_000_000, 1)}M MRT`],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label} className="min-w-0 px-4 py-3">
            <p className="truncate text-[9px] tracking-eyebrow text-ledger">{label}</p>
            <p className="mt-1 truncate text-[13px] text-navy">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-sans text-xs leading-relaxed text-ledger">{pool.description}</p>

        <div className="mt-4 flex items-baseline justify-between font-mono text-[10px] text-ledger">
          <span>AMOUNT ({pool.pair[0]})</span>
          <span>
            BALANCE:{" "}
            {balance === null ? "—" : `${fmt(balance, 2)} MRT`}
            {balance !== null && balance > 0 && (
              <button
                onClick={() => setAmount(String(Math.floor(balance)))}
                className="ml-2 text-compass underline-offset-2 hover:underline"
              >
                MAX
              </button>
            )}
          </span>
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={`Min ${fmt(pool.minStake)}`}
          inputMode="decimal"
          className="mt-2 h-11 w-full rounded border border-grid bg-paper px-3 font-mono text-sm text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none"
        />

        <div className="mt-3 flex justify-between font-mono text-[11px]">
          <span className="text-ledger">EST. REWARD / LOCK</span>
          <span className="text-compass">
            +{reward > 0 ? fmt(reward, 2) : "0"} {pool.pair[0]}
          </span>
        </div>

        <div className="mt-auto pt-5">
          {!isConnected ? (
            <div className="[&>button]:w-full [&>button]:justify-center">
              <ConnectWallet />
            </div>
          ) : (
            <button
              disabled
              className="btn-primary w-full justify-center opacity-40"
              title={contractReady ? "Deposits open shortly" : "Staking contract in audit"}
            >
              <Lock size={14} strokeWidth={1.75} />
              {contractReady ? "Stake — opening soon" : "Stake — contract in audit"}
            </button>
          )}
          <p className="mt-2.5 text-center font-mono text-[9px] tracking-eyebrow text-ledger">
            {contractReady
              ? `POOL CONTRACT ${shortAddress(pool.contract)}`
              : "POOL CONTRACT — TO BE ANNOUNCED"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StakeClient({ pools }: { pools: StakePool[] }) {
  const { address, isConnected } = useAccount();
  const { data: rawBalance } = useReadContract({
    address: MRT_TOKEN.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const balance =
    isConnected && rawBalance !== undefined
      ? Number(formatUnits(rawBalance, MRT_TOKEN.decimals))
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        {pools
          .filter((p) => p.active)
          .map((pool) => (
            <PoolCard key={pool.id} pool={pool} balance={balance} />
          ))}
      </div>
      <div className="min-w-0 space-y-6">
        <TokenCard />
        <div className="rounded-lg border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">HOW STAKING WORKS</p>
          <ol className="space-y-3.5">
            {[
              ["01", "Stake MRT (or MRT-USDT LP) into a pool."],
              ["02", "Rewards stream per block from protocol fees."],
              ["03", "Principal unlocks after the pool's lock period."],
            ].map(([n, t]) => (
              <li key={n} className="flex gap-3">
                <span className="font-mono text-[10px] text-compass">{n}</span>
                <span className="font-sans text-xs leading-relaxed text-ledger">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
