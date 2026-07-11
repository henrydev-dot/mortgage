"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  Landmark,
  Loader2,
  MapPin,
  Ruler,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { erc20Abi, parseEther, parseUnits } from "viem";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import ConnectWallet from "./ConnectWallet";
import { BASE_CHAIN, isValidAddress } from "@/lib/airdrop";
import type { AppConfig, AppProperty } from "@/lib/appSeed";

const usd = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function PropertyDetail({ property: p }: { property: AppProperty }) {
  const { address, isConnected } = useAccount();
  const [imageIndex, setImageIndex] = useState(0);
  const [tokens, setTokens] = useState(10);

  // Reservation payments — treasury + amounts come from /admin/settings
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [reserving, setReserving] = useState<"USDT" | "ETH" | null>(null);
  const [reserveTx, setReserveTx] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  useEffect(() => {
    fetch("/api/app/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setConfig(d.config))
      .catch(() => {});
  }, []);

  const reservationsOpen =
    p.status === "MINTING" && !!config && isValidAddress(config.treasuryAddress);

  const recordOrder = async (txHash: string, amount: number, currency: "USDT" | "ETH") => {
    setReserveTx(txHash);
    await fetch("/api/app/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: p.id, address, txHash, amount, currency }),
    }).catch(() => {});
  };

  const reserveUsdt = async () => {
    if (!config || !address) return;
    setReserving("USDT");
    setReserveError(null);
    try {
      const hash = await writeContractAsync({
        address: config.usdtAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          config.treasuryAddress as `0x${string}`,
          parseUnits(String(config.startAmountUsdt), 6),
        ],
      });
      await recordOrder(hash, config.startAmountUsdt, "USDT");
    } catch {
      setReserveError("Transaction rejected or failed.");
    } finally {
      setReserving(null);
    }
  };

  const reserveEth = async () => {
    if (!config || !address) return;
    setReserving("ETH");
    setReserveError(null);
    try {
      const hash = await sendTransactionAsync({
        to: config.treasuryAddress as `0x${string}`,
        value: parseEther(String(config.startAmountEth)),
      });
      await recordOrder(hash, config.startAmountEth, "ETH");
    } catch {
      setReserveError("Transaction rejected or failed.");
    } finally {
      setReserving(null);
    }
  };

  const fees = useMemo(() => {
    const base = tokens * p.tokenPriceUsdt;
    const tokenization = (base * p.feesPct.tokenization) / 100;
    const platform = (base * p.feesPct.platform) / 100;
    const legal = (base * p.feesPct.legalCustody) / 100;
    return { base, tokenization, platform, legal, total: base + tokenization + platform + legal };
  }, [tokens, p]);

  const specRows = [
    { icon: Building2, label: "TYPE", value: p.specs.type },
    { icon: Ruler, label: "AREA", value: `${p.specs.areaM2} m²` },
    { icon: BedDouble, label: "BEDROOMS", value: String(p.specs.bedrooms) },
    { icon: Bath, label: "BATHROOMS", value: String(p.specs.bathrooms) },
    { icon: CalendarDays, label: "BUILT", value: String(p.specs.built) },
    { icon: Landmark, label: "TENURE", value: p.specs.tenure },
  ];

  return (
    <div className="pt-6">
      <Link
        href="/app"
        className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wider text-ledger transition-colors hover:text-compass"
      >
        <ArrowLeft size={14} strokeWidth={1.75} />
        ALL PROPERTIES
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Left — gallery + facts */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-grid bg-paper">
            <div className="relative aspect-[16/9] border-b border-grid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[imageIndex] ?? p.images[0]}
                alt={`${p.city} — image ${imageIndex + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded border border-paper/30 bg-navy/70 px-2 py-1 font-mono text-[9px] tracking-eyebrow text-paper/80 backdrop-blur-sm">
                {p.id} · {imageIndex + 1}/{p.images.length}
              </span>
            </div>
            <div className="flex gap-2 p-3">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImageIndex(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`relative aspect-[16/9] w-24 overflow-hidden rounded border transition-colors ${
                    i === imageIndex ? "border-compass" : "border-grid hover:border-compass/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-grid bg-paper p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="font-display text-2xl tracking-tight text-navy md:text-3xl">
                {p.title}
              </h1>
              <span className="font-mono text-sm text-compass">{p.ticker}</span>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-ledger">
              <MapPin size={12} strokeWidth={1.5} />
              {p.city}, {p.country} · {p.coordinates}
            </p>
            <p className="mt-4 font-sans text-sm leading-relaxed text-navy/80">
              {p.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-grid pt-5 sm:grid-cols-3">
              {specRows.map((row) => (
                <div key={row.label} className="flex items-start gap-2.5">
                  <row.icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-compass" />
                  <div>
                    <p className="font-mono text-[9px] tracking-eyebrow text-ledger">{row.label}</p>
                    <p className="mt-0.5 font-sans text-sm text-navy">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-grid pt-5">
              <p className="font-mono text-[9px] tracking-eyebrow text-ledger">FEATURES</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <span
                    key={f}
                    className="rounded border border-grid bg-fog px-2.5 py-1 font-sans text-xs text-navy"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — buy panel */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-grid bg-paper lg:sticky lg:top-32">
            <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
              <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger sm:block">
                MRT://ORDER
              </span>
              <span className="ml-auto font-mono text-[9px] tracking-eyebrow text-compass">
                {p.status}
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-grid border-b border-grid font-mono">
              {[
                ["ASSET PRICE", `$${usd(p.priceUsdt)}`],
                ["TOKEN PRICE", `${p.tokenPriceUsdt} USDT`],
                ["NET APY", `${p.apy.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 overflow-hidden px-4 py-3">
                  <p className="truncate text-[9px] tracking-eyebrow text-ledger">{label}</p>
                  <p className="mt-1 truncate text-[13px] text-navy">{value}</p>
                </div>
              ))}
            </div>

            <div className="p-5">
              <div className="flex items-baseline justify-between font-mono text-[10px] text-ledger">
                <span>FUNDED</span>
                <span>
                  {p.funded}% · {usd(Math.round((p.totalTokens * p.funded) / 100))}/
                  {usd(p.totalTokens)} TOKENS
                </span>
              </div>
              <div className="mt-1.5 h-px w-full bg-grid">
                <div className="h-px bg-compass" style={{ width: `${p.funded}%` }} />
              </div>

              <label className="mt-6 block font-mono text-[10px] tracking-eyebrow text-ledger">
                TOKENS TO MINT
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={tokens}
                  onChange={(e) =>
                    setTokens(Math.max(1, Math.min(100000, Number(e.target.value) || 1)))
                  }
                  className="h-11 w-full rounded border border-grid bg-paper px-3 font-mono text-sm text-navy focus:border-compass focus:outline-none"
                />
                {[10, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTokens(n)}
                    className="rounded border border-grid px-3 py-2.5 font-mono text-[11px] text-ledger transition-colors hover:border-compass hover:text-compass"
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Fee breakdown */}
              <dl className="mt-5 space-y-2 border-t border-grid pt-4 font-mono text-[11px]">
                <div className="flex justify-between text-navy">
                  <dt>
                    {tokens} × {p.tokenPriceUsdt} USDT
                  </dt>
                  <dd>{usd(fees.base)} USDT</dd>
                </div>
                <div className="flex justify-between text-ledger">
                  <dt>TOKENIZATION FEE · {p.feesPct.tokenization}%</dt>
                  <dd>{fees.tokenization.toFixed(2)} USDT</dd>
                </div>
                <div className="flex justify-between text-ledger">
                  <dt>PLATFORM FEE · {p.feesPct.platform}%</dt>
                  <dd>{fees.platform.toFixed(2)} USDT</dd>
                </div>
                <div className="flex justify-between text-ledger">
                  <dt>LEGAL & CUSTODY · {p.feesPct.legalCustody}%</dt>
                  <dd>{fees.legal.toFixed(2)} USDT</dd>
                </div>
                <div className="flex justify-between border-t border-grid pt-2 text-[13px] text-navy">
                  <dt>TOTAL</dt>
                  <dd>{usd(Math.round(fees.total))} USDT</dd>
                </div>
                <div className="flex justify-between text-ledger">
                  <dt>EST. YEARLY YIELD</dt>
                  <dd className="text-compass">
                    +{((fees.base * p.apy) / 100).toFixed(2)} USDT
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                {!isConnected ? (
                  <div className="[&>button]:w-full [&>button]:justify-center">
                    <ConnectWallet />
                  </div>
                ) : reserveTx ? (
                  <div className="rounded border border-compass/40 bg-compass/5 p-4">
                    <p className="flex items-center gap-2 font-sans text-sm font-medium text-compass">
                      <Check size={16} strokeWidth={2} />
                      Reservation payment sent.
                    </p>
                    <p className="mt-1.5 font-sans text-xs leading-relaxed text-ledger">
                      The team verifies the transaction and contacts you with
                      allocation details.
                    </p>
                    <a
                      href={`${BASE_CHAIN.explorer}/tx/${reserveTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="arrow-link mt-3 font-mono !text-[11px] tracking-wider"
                    >
                      VIEW TRANSACTION
                      <ArrowUpRight size={13} strokeWidth={1.75} />
                    </a>
                  </div>
                ) : reservationsOpen && config ? (
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
                      RESERVE THIS PROPERTY — START PAYMENT TO THE TREASURY
                    </p>
                    <button
                      onClick={reserveUsdt}
                      disabled={reserving !== null}
                      className="btn-primary w-full justify-center disabled:opacity-40"
                    >
                      {reserving === "USDT" ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        `Reserve with ${config.startAmountUsdt} USDT`
                      )}
                    </button>
                    <button
                      onClick={reserveEth}
                      disabled={reserving !== null}
                      className="btn-ghost w-full justify-center !bg-paper disabled:opacity-40"
                    >
                      {reserving === "ETH" ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        `Reserve with ${config.startAmountEth} ETH`
                      )}
                    </button>
                    {reserveError && (
                      <p className="flex items-center gap-1.5 font-sans text-xs text-coral">
                        <XCircle size={13} strokeWidth={1.5} />
                        {reserveError}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    disabled
                    className="btn-primary w-full justify-center opacity-40"
                    title={
                      p.status === "MINTING"
                        ? "Reservations open once the treasury address is configured"
                        : "This property is not minting"
                    }
                  >
                    {p.status === "MINTING"
                      ? "Reservations opening soon"
                      : p.status === "SOLD OUT"
                        ? "Sold out"
                        : "Trades on secondary market"}
                  </button>
                )}
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[9px] tracking-eyebrow text-ledger">
                  <ShieldCheck size={12} strokeWidth={1.5} className="text-compass" />
                  SPV-BACKED · AUDITED · SETTLED IN USDT ON BASE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
