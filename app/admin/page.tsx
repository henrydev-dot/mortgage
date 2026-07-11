import Link from "next/link";

const tools = [
  ["Properties", "/admin/properties", "Listings editor with photo uploads"],
  ["App settings", "/admin/settings", "Treasury address, reservation amounts, contract addresses"],
  ["Reservations", "/admin/orders", "Property reservation payments (USDT/ETH)"],
  ["Stake pools", "/admin/pools", "APR, lock, TVL, contract addresses"],
  ["Escrow agents", "/admin/escrow", "Approve / reject registrations"],
  ["Airdrop applications", "/admin/airdrop", "Applications, referrers, payouts owed"],
  ["Buy & burn ledger", "/admin/burns", "Buyback history (JSON)"],
  ["Waitlist emails", "/admin/emails", "Landing-page waitlist signups"],
];

export default function AdminIndexPage() {
  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line mx-auto max-w-3xl">
        <h1 className="mb-6 font-display text-3xl text-navy">Admin</h1>
        <div className="divide-y divide-grid overflow-hidden rounded border border-grid bg-paper">
          {tools.map(([label, href, desc]) => (
            <Link key={href} href={href} className="block px-6 py-4 transition-colors hover:bg-fog">
              <p className="font-sans text-sm font-medium text-navy">{label}</p>
              <p className="mt-0.5 font-sans text-xs text-ledger">{desc}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] tracking-wider text-ledger">
          SET ADMIN_KEY IN THE ENV TO LOCK WRITE ACTIONS
        </p>
      </div>
    </div>
  );
}
