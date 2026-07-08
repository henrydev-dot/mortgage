import { Landmark, ScanSearch, Droplets } from "lucide-react";
import Reveal from "./Reveal";

const pillars = [
  {
    icon: Landmark,
    title: "Regulated Custody",
    description:
      "Every property sits inside a licensed special-purpose vehicle with an independent custodian and annual third-party audits. Your token is a legal claim, not a promise.",
    data: "SPV-BACKED · AUDITED ANNUALLY",
  },
  {
    icon: ScanSearch,
    title: "Onchain Transparency",
    description:
      "Ownership registers, rental flows, and valuations are published to Base in real time. Anyone can verify the ledger — no quarterly PDF, no trust required.",
    data: "100% OF FLOWS VERIFIABLE ONCHAIN",
  },
  {
    icon: Droplets,
    title: "Liquidity",
    description:
      "Real estate without the ten-year lockup. Exit through the secondary orderbook in seconds, or hold and stream monthly USDC yield. You choose the horizon.",
    data: "T+0 SETTLEMENT · 24/7 MARKETS",
  },
];

export default function WhyUs() {
  return (
    <section id="why" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-line">
        <Reveal>
          <p className="eyebrow mb-4">WHY MORTGAGE ESTATE</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="max-w-2xl font-display text-4xl tracking-tight text-navy md:text-5xl">
            The trust of a land registry, the speed of a chain.
          </h2>
        </Reveal>

        <div className="mt-14 grid divide-y divide-grid border-y border-grid lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {pillars.map((p, i) => (
            <Reveal key={p.title} index={i} className="h-full">
              <div className="flex h-full flex-col py-10 lg:px-10 lg:first:pl-0">
                <p.icon size={26} strokeWidth={1.25} className="text-compass" />
                <h3 className="mt-6 font-display text-2xl text-navy">{p.title}</h3>
                <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-ledger">
                  {p.description}
                </p>
                <p className="mt-8 font-mono text-[11px] tracking-wider text-compass">
                  {p.data}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
