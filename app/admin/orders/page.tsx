import { ArrowUpRight } from "lucide-react";
import { BASE_CHAIN } from "@/lib/airdrop";
import type { Order } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await readCollection<Order>("orders", []);
  const sorted = [...orders].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const totalUsdt = orders.filter((o) => o.currency === "USDT").reduce((s, o) => s + o.amount, 0);
  const totalEth = orders.filter((o) => o.currency === "ETH").reduce((s, o) => s + o.amount, 0);

  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line mx-auto max-w-5xl">
        <h1 className="mb-1 font-display text-3xl text-navy">Reservations</h1>
        <p className="mb-6 font-sans text-sm text-ledger">
          Property reservation payments sent to the treasury address — verify
          each tx on Basescan before allocating.
        </p>

        <div className="overflow-hidden rounded border border-grid bg-paper">
          <div className="bg-navy px-6 py-4">
            <span className="font-mono text-xs uppercase tracking-wider text-paper/60">
              Reservations ({orders.length}) · {totalUsdt.toLocaleString("en-US")} USDT ·{" "}
              {totalEth} ETH
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid bg-fog font-mono text-[10px] uppercase tracking-wider text-ledger">
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Tx</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid font-mono text-[12px] text-navy">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-ledger">
                      No reservations yet.
                    </td>
                  </tr>
                ) : (
                  sorted.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3">{o.propertyId}</td>
                      <td className="px-4 py-3">{o.address}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {o.amount} {o.currency}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`${BASE_CHAIN.explorer}/tx/${o.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-compass hover:underline"
                        >
                          {o.txHash.slice(0, 10)}…
                          <ArrowUpRight size={11} strokeWidth={1.5} />
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ledger">
                        {new Date(o.ts).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
