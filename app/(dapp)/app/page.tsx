import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHeader, { StatBlock } from "@/components/dapp/PageHeader";
import { seedProperties, type AppProperty } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: AppProperty["status"] }) {
  if (status === "MINTING") {
    return (
      <span className="flex items-center gap-1.5 rounded border border-coral/40 bg-paper/90 px-2 py-1 font-mono text-[9px] tracking-eyebrow text-coral backdrop-blur-sm">
        <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
        MINTING
      </span>
    );
  }
  if (status === "SOLD OUT") {
    return (
      <span className="rounded border border-grid bg-paper/90 px-2 py-1 font-mono text-[9px] tracking-eyebrow text-ledger backdrop-blur-sm">
        SOLD OUT
      </span>
    );
  }
  return (
    <span className="rounded border border-compass/40 bg-paper/90 px-2 py-1 font-mono text-[9px] tracking-eyebrow text-compass backdrop-blur-sm">
      SECONDARY
    </span>
  );
}

export default async function PropertiesPage() {
  const properties = await readCollection<AppProperty>("properties", seedProperties);
  const tvl = properties.reduce((s, p) => s + (p.priceUsdt * p.funded) / 100, 0);
  const avgApy = properties.reduce((s, p) => s + p.apy, 0) / (properties.length || 1);

  return (
    <>
      <PageHeader
        eyebrow="TOKENIZED PROPERTIES · LIVE ON BASE"
        title="Properties."
        sub="Every asset is held by a regulated SPV and mirrored onchain. Prices, fees, and yield are settled in USDT."
      >
        <StatBlock value={`$${(tvl / 1_000_000).toFixed(1)}M`} label="VALUE TOKENIZED" />
        <StatBlock value={`${avgApy.toFixed(1)}%`} label="AVG NET YIELD" />
        <StatBlock value={String(properties.length)} label="ASSETS LISTED" />
      </PageHeader>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/app/property/${p.id}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-grid bg-paper transition-colors duration-300 hover:border-compass/60"
          >
            <div className="relative aspect-[16/9] overflow-hidden border-b border-grid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]}
                alt={`${p.city} — ${p.title}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute left-3 top-3 rounded border border-paper/30 bg-navy/70 px-2 py-1 font-mono text-[9px] tracking-eyebrow text-paper/80 backdrop-blur-sm">
                {p.id}
              </span>
              <span className="absolute right-3 top-3">
                <StatusPill status={p.status} />
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="truncate font-display text-xl text-navy">{p.city}</h2>
                <span className="shrink-0 font-mono text-[11px] text-compass">{p.ticker}</span>
              </div>
              <p className="mt-0.5 truncate font-sans text-xs text-ledger">
                {p.title} · {p.country}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-grid pt-4 font-mono">
                <div>
                  <p className="text-[9px] tracking-eyebrow text-ledger">PRICE</p>
                  <p className="mt-1 text-[13px] text-navy">
                    ${(p.priceUsdt / 1_000_000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-[9px] tracking-eyebrow text-ledger">TOKEN</p>
                  <p className="mt-1 text-[13px] text-navy">{p.tokenPriceUsdt} USDT</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-eyebrow text-ledger">APY</p>
                  <p className="mt-1 text-[13px] text-navy">{p.apy.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between font-mono text-[10px] text-ledger">
                  <span>FUNDED</span>
                  <span>{p.funded}%</span>
                </div>
                <div className="mt-1.5 h-px w-full bg-grid">
                  <div className="h-px bg-compass" style={{ width: `${p.funded}%` }} />
                </div>
              </div>

              <span className="arrow-link mt-5">
                View details
                <ArrowRight size={14} strokeWidth={1.75} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
