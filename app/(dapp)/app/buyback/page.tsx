import type { Metadata } from "next";
import { ArrowUpRight, Flame } from "lucide-react";
import PageHeader, { StatBlock } from "@/components/dapp/PageHeader";
import { BASE_CHAIN, MRT_TOKEN } from "@/lib/airdrop";
import { seedBurns, type BurnEvent } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buy & Burn" };

const DEAD = "0x000000000000000000000000000000000000dEaD";
const fmt = (n: number) => n.toLocaleString("en-US");

export default async function BuybackPage() {
  const burns = await readCollection<BurnEvent>("burns", seedBurns);
  const sorted = [...burns].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalBurned = burns.reduce((s, b) => s + b.amountMrt, 0);
  const totalSpent = burns.reduce((s, b) => s + b.usdtSpent, 0);
  const avgPrice = totalBurned > 0 ? totalSpent / totalBurned : 0;

  return (
    <>
      <PageHeader
        eyebrow="BUY & BURN · DEFLATIONARY BY POLICY"
        title="Buy & Burn."
        sub="A share of protocol fees buys MRT back from the market every month and sends it to the burn address — permanently out of supply."
      >
        <StatBlock value={`${(totalBurned / 1_000_000).toFixed(2)}M MRT`} label="BURNED TO DATE" />
        <StatBlock value={`$${fmt(totalSpent)}`} label="USDT SPENT" />
        <StatBlock value={`$${avgPrice.toFixed(4)}`} label="AVG BUYBACK PRICE" />
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Burn ledger */}
        <div className="min-w-0 overflow-hidden rounded-lg border border-grid bg-paper">
          <div className="flex items-center justify-between bg-navy px-5 py-3">
            <span className="font-mono text-[10px] tracking-eyebrow text-paper/60">
              MRT://BURN-LEDGER
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-eyebrow text-paper/60">
              <Flame size={12} strokeWidth={1.5} className="text-coral" />
              {burns.length} EVENTS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid bg-fog font-mono text-[9px] uppercase tracking-eyebrow text-ledger">
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5">MRT burned</th>
                  <th className="px-5 py-2.5">USDT spent</th>
                  <th className="px-5 py-2.5">Price</th>
                  <th className="px-5 py-2.5">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid font-mono text-[12px]">
                {sorted.map((b) => (
                  <tr key={b.id} className="text-navy">
                    <td className="whitespace-nowrap px-5 py-3.5 text-ledger">{b.date}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="flex items-center gap-1.5">
                        <Flame size={12} strokeWidth={1.5} className="text-coral" />
                        {fmt(b.amountMrt)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">${fmt(b.usdtSpent)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-ledger">
                      ${(b.usdtSpent / b.amountMrt).toFixed(4)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {b.tx ? (
                        <a
                          href={`${BASE_CHAIN.explorer}/tx/${b.tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-compass hover:underline"
                        >
                          {b.tx.slice(0, 8)}…
                          <ArrowUpRight size={11} strokeWidth={1.5} />
                        </a>
                      ) : (
                        <span className="text-ledger">PENDING ONCHAIN</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Policy rail */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-lg border border-grid bg-paper p-5">
            <p className="eyebrow mb-4">BURN POLICY</p>
            <ul className="space-y-2.5 font-mono text-[11px] leading-relaxed tracking-wide text-ledger">
              <li>· 20% OF PROTOCOL FEES → MONTHLY BUYBACK</li>
              <li>· BOUGHT ON THE OPEN MARKET</li>
              <li>· SENT TO THE 0xdEaD BURN ADDRESS</li>
              <li>· IRREVERSIBLE — SUPPLY ONLY DECREASES</li>
              <li>· GOVERNED BY DAO VOTE (SEE MIP-2)</li>
            </ul>
          </div>
          <div className="rounded-lg border border-grid bg-paper p-5">
            <p className="eyebrow mb-3">BURN ADDRESS</p>
            <p className="break-all font-mono text-[11px] leading-relaxed text-navy">{DEAD}</p>
            <a
              href={`${BASE_CHAIN.explorer}/token/${MRT_TOKEN.address}?a=${DEAD}`}
              target="_blank"
              rel="noopener noreferrer"
              className="arrow-link mt-4 font-mono !text-[11px] tracking-wider"
            >
              VERIFY ON BASESCAN
              <ArrowUpRight size={13} strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
