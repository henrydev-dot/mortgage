import { Wallet, ArrowLeftRight, Layers, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

const methods = [
  {
    icon: Wallet,
    title: "Direct Mint",
    description:
      "Buy fractional tokens directly when a property lists. Fixed mint price, first-come allocation, settled instantly in USDC.",
    data: "FROM 95 USDC · 0% MINT FEE",
    cta: "See live mints",
  },
  {
    icon: ArrowLeftRight,
    title: "Secondary Market",
    description:
      "Buy and sell existing property tokens anytime on the built-in orderbook. Prices set by real-time demand, not appraisals.",
    data: "0.25% TAKER FEE · 24/7 SETTLEMENT",
    cta: "Open the orderbook",
  },
  {
    icon: Layers,
    title: "Yield Vaults",
    description:
      "Deposit stablecoins into a diversified basket of property tokens across cities. Earn blended rental yield without picking assets.",
    data: "4.3% BLENDED APY · AUTO-COMPOUND",
    cta: "Explore vaults",
  },
];

export default function InvestmentMethods() {
  return (
    <section id="invest" className="scroll-mt-16 border-t border-grid bg-fog py-24 md:py-32">
      <div className="container-line">
        <Reveal>
          <p className="eyebrow mb-4">THREE ENTRY POINTS</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="font-display text-4xl tracking-tight text-navy md:text-5xl">
            Ways to invest
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {methods.map((m, i) => (
            <Reveal key={m.title} index={i}>
              <div className="flex h-full flex-col rounded border border-grid bg-paper p-8 transition-colors duration-300 hover:border-compass/60">
                <m.icon size={28} strokeWidth={1.25} className="text-compass" />
                <h3 className="mt-6 font-display text-2xl text-navy">{m.title}</h3>
                <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-ledger">
                  {m.description}
                </p>
                <p className="mt-6 border-t border-grid pt-4 font-mono text-[11px] tracking-wider text-navy">
                  {m.data}
                </p>
                <a href="#" className="arrow-link mt-5">
                  {m.cta}
                  <ArrowRight size={14} strokeWidth={1.75} />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
