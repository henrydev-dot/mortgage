"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Landmark } from "lucide-react";
import { useAccount } from "wagmi";
import ConnectWallet from "./ConnectWallet";
import { LOAN_TERMS_MONTHS, type LendMarket } from "@/lib/appSeed";

type RepayMode = "monthly" | "bullet";

const usd = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function LendClient({ markets }: { markets: LendMarket[] }) {
  const { isConnected } = useAccount();
  const [symbol, setSymbol] = useState(markets[0].symbol);
  const [collateral, setCollateral] = useState("1");
  const [ltvPct, setLtvPct] = useState(50);
  const [term, setTerm] = useState(12);
  const [mode, setMode] = useState<RepayMode>("monthly");

  const market = markets.find((m) => m.symbol === symbol) ?? markets[0];
  const collateralAmount = Number(collateral) || 0;

  const calc = useMemo(() => {
    const collateralValue = collateralAmount * market.priceUsd;
    const ltv = Math.min(ltvPct / 100, market.maxLtv);
    const principal = collateralValue * ltv;
    const apr = market.aprPct / 100;
    const r = apr / 12;
    const n = term;

    // Amortized monthly installment
    const monthly = principal > 0 ? (principal * r) / (1 - Math.pow(1 + r, -n)) : 0;
    const totalMonthly = monthly * n;
    // Bullet: interest accrues, everything due at maturity
    const totalBullet = principal * (1 + apr * (n / 12));

    const total = mode === "monthly" ? totalMonthly : totalBullet;
    const interest = total - principal;
    const liquidationPrice =
      collateralAmount > 0 && principal > 0
        ? principal / (collateralAmount * market.liqThreshold)
        : 0;
    const healthFactor =
      principal > 0 ? (collateralValue * market.liqThreshold) / principal : Infinity;

    return {
      collateralValue,
      principal,
      monthly,
      total,
      interest,
      liquidationPrice,
      healthFactor,
    };
  }, [collateralAmount, market, ltvPct, term, mode]);

  const effLtv = Math.min(ltvPct, market.maxLtv * 100);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      {/* Inputs */}
      <div className="min-w-0 overflow-hidden rounded-lg border border-grid bg-paper">
        <div className="flex items-center justify-between border-b border-grid bg-fog px-5 py-3">
          <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
            MRT://BORROW_CALCULATOR
          </span>
          <span className="font-mono text-[9px] tracking-eyebrow text-compass">
            BORROW USDT
          </span>
        </div>

        <div className="space-y-6 p-6">
          {/* Collateral asset */}
          <div>
            <p className="font-mono text-[10px] tracking-eyebrow text-ledger">
              COLLATERAL ASSET
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {markets.map((m) => (
                <button
                  key={m.symbol}
                  onClick={() => setSymbol(m.symbol)}
                  className={`rounded border px-3.5 py-2 font-mono text-[11px] tracking-wider transition-colors ${
                    symbol === m.symbol
                      ? "border-compass bg-compass/5 text-compass"
                      : "border-grid text-ledger hover:border-compass/50 hover:text-navy"
                  }`}
                >
                  {m.symbol}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-ledger">
              {market.name} · ${usd(market.priceUsd, market.priceUsd < 10 ? 3 : 0)} · MAX LTV{" "}
              {Math.round(market.maxLtv * 100)}% · APR {market.aprPct.toFixed(1)}%
            </p>
          </div>

          {/* Collateral amount */}
          <div>
            <p className="font-mono text-[10px] tracking-eyebrow text-ledger">
              COLLATERAL AMOUNT ({market.symbol})
            </p>
            <input
              value={collateral}
              onChange={(e) => setCollateral(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="mt-2 h-11 w-full max-w-xs rounded border border-grid bg-paper px-3 font-mono text-sm text-navy focus:border-compass focus:outline-none"
            />
            <p className="mt-2 font-mono text-[10px] text-ledger">
              VALUE: <span className="text-navy">${usd(calc.collateralValue, 0)}</span>
            </p>
          </div>

          {/* LTV slider */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[10px] tracking-eyebrow text-ledger">
                LOAN-TO-VALUE
              </p>
              <p className="font-mono text-[12px] text-navy">{Math.round(effLtv)}%</p>
            </div>
            <input
              type="range"
              min={5}
              max={Math.round(market.maxLtv * 100)}
              value={Math.round(effLtv)}
              onChange={(e) => setLtvPct(Number(e.target.value))}
              className="mt-3 w-full accent-[#275CAB]"
            />
            <div className="mt-1 flex justify-between font-mono text-[9px] text-ledger">
              <span>5%</span>
              <span>SAFE</span>
              <span>MAX {Math.round(market.maxLtv * 100)}%</span>
            </div>
          </div>

          {/* Term */}
          <div>
            <p className="font-mono text-[10px] tracking-eyebrow text-ledger">TERM</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {LOAN_TERMS_MONTHS.map((m) => (
                <button
                  key={m}
                  onClick={() => setTerm(m)}
                  className={`rounded border px-3.5 py-2 font-mono text-[11px] transition-colors ${
                    term === m
                      ? "border-compass bg-compass/5 text-compass"
                      : "border-grid text-ledger hover:border-compass/50 hover:text-navy"
                  }`}
                >
                  {m} MO
                </button>
              ))}
            </div>
          </div>

          {/* Repayment mode */}
          <div>
            <p className="font-mono text-[10px] tracking-eyebrow text-ledger">REPAYMENT</p>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  ["monthly", "Monthly installments", "Equal payments, principal + interest"],
                  ["bullet", "At maturity", "One payment at the end of the term"],
                ] as [RepayMode, string, string][]
              ).map(([value, label, desc]) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`rounded border px-4 py-3 text-left transition-colors ${
                    mode === value
                      ? "border-compass bg-compass/5"
                      : "border-grid hover:border-compass/50"
                  }`}
                >
                  <p className={`font-sans text-sm font-medium ${mode === value ? "text-compass" : "text-navy"}`}>
                    {label}
                  </p>
                  <p className="mt-0.5 font-sans text-[11px] text-ledger">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="min-w-0">
        <div className="overflow-hidden rounded-lg border border-grid bg-paper lg:sticky lg:top-32">
          <div className="border-b border-grid bg-navy px-5 py-4">
            <p className="font-mono text-[9px] tracking-eyebrow text-paper/50">YOU BORROW</p>
            <p className="mt-1 font-mono text-3xl text-paper">
              {usd(calc.principal, 0)} <span className="text-base text-paper/60">USDT</span>
            </p>
          </div>

          <dl className="divide-y divide-grid font-mono text-[12px]">
            {(
              [
                ["COLLATERAL", `${collateralAmount || 0} ${market.symbol} · $${usd(calc.collateralValue, 0)}`],
                ["APR", `${market.aprPct.toFixed(1)}%`],
                [
                  mode === "monthly" ? "MONTHLY PAYMENT" : "DUE AT MATURITY",
                  mode === "monthly"
                    ? `${usd(calc.monthly)} USDT × ${term}`
                    : `${usd(calc.total)} USDT`,
                ],
                ["TOTAL REPAYMENT", `${usd(calc.total)} USDT`],
                ["TOTAL INTEREST", `${usd(calc.interest)} USDT`],
                [
                  "LIQUIDATION PRICE",
                  calc.liquidationPrice > 0
                    ? `$${usd(calc.liquidationPrice, market.priceUsd < 10 ? 4 : 2)} / ${market.symbol}`
                    : "—",
                ],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 px-5 py-3">
                <dt className="text-[9px] tracking-eyebrow text-ledger">{label}</dt>
                <dd className="text-right text-navy">{value}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 px-5 py-3">
              <dt className="text-[9px] tracking-eyebrow text-ledger">HEALTH FACTOR</dt>
              <dd
                className={`text-right ${
                  calc.healthFactor < 1.2
                    ? "text-coral"
                    : calc.healthFactor < 1.6
                      ? "text-navy"
                      : "text-compass"
                }`}
              >
                {Number.isFinite(calc.healthFactor) ? calc.healthFactor.toFixed(2) : "∞"}
              </dd>
            </div>
          </dl>

          {calc.healthFactor < 1.25 && Number.isFinite(calc.healthFactor) && (
            <p className="flex items-start gap-2 border-t border-grid bg-coral/5 px-5 py-3 font-sans text-[11px] leading-relaxed text-coral">
              <AlertTriangle size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              High LTV — a small price move in {market.symbol} could liquidate this position.
            </p>
          )}

          <div className="border-t border-grid bg-fog p-5">
            {!isConnected ? (
              <div className="[&>button]:w-full [&>button]:justify-center">
                <ConnectWallet />
              </div>
            ) : (
              <button
                disabled
                className="btn-primary w-full justify-center opacity-40"
                title="Lending market contract in audit"
              >
                <Landmark size={14} strokeWidth={1.75} />
                Open position — contract in audit
              </button>
            )}
            <p className="mt-2.5 text-center font-mono text-[9px] tracking-eyebrow text-ledger">
              RATES ARE INDICATIVE UNTIL THE MARKET CONTRACT IS LIVE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
