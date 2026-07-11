import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Flame,
  Gift,
  Layers,
  ReceiptText,
  Scale,
  Settings,
} from "lucide-react";
import {
  defaultConfig,
  seedBurns,
  seedEscrowAgents,
  seedPools,
  seedProperties,
  type AppConfig,
  type AppProperty,
  type BurnEvent,
  type EscrowAgent,
  type Order,
  type StakePool,
} from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";
import { loadApplications } from "@/lib/airdropStore";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [properties, orders, escrow, pools, burns, [config]] = await Promise.all([
    readCollection<AppProperty>("properties", seedProperties),
    readCollection<Order>("orders", []),
    readCollection<EscrowAgent>("escrow", seedEscrowAgents),
    readCollection<StakePool>("pools", seedPools),
    readCollection<BurnEvent>("burns", seedBurns),
    readCollection<AppConfig>("config", [defaultConfig]),
  ]);
  const applications = loadApplications();

  const pendingEscrow = escrow.filter((a) => a.status === "pending").length;
  const orderUsdt = orders.filter((o) => o.currency === "USDT").reduce((s, o) => s + o.amount, 0);
  const airdropCount = Object.keys(applications).length;
  const treasurySet = Boolean(config?.treasuryAddress || defaultConfig.treasuryAddress);

  const cards = [
    {
      icon: Building2,
      label: "Properties",
      href: "/admin/properties",
      value: String(properties.length),
      sub: `${properties.filter((p) => p.status === "MINTING").length} MINTING`,
    },
    {
      icon: ReceiptText,
      label: "Reservations",
      href: "/admin/orders",
      value: String(orders.length),
      sub: `${orderUsdt.toLocaleString("en-US")} USDT COLLECTED`,
    },
    {
      icon: Scale,
      label: "Escrow agents",
      href: "/admin/escrow",
      value: String(escrow.filter((a) => a.status === "approved").length),
      sub: pendingEscrow > 0 ? `${pendingEscrow} PENDING REVIEW` : "NOTHING PENDING",
      alert: pendingEscrow > 0,
    },
    {
      icon: Gift,
      label: "Airdrop applications",
      href: "/admin/airdrop",
      value: String(airdropCount),
      sub: `${(airdropCount * 1000).toLocaleString("en-US")} MRT OWED`,
    },
    {
      icon: Layers,
      label: "Stake pools",
      href: "/admin/pools",
      value: String(pools.filter((p) => p.active).length),
      sub: pools.every((p) => p.contract) ? "CONTRACTS SET" : "CONTRACT MISSING",
    },
    {
      icon: Flame,
      label: "MRT burned",
      href: "/admin/burns",
      value: `${(burns.reduce((s, b) => s + b.amountMrt, 0) / 1_000_000).toFixed(1)}M`,
      sub: `${burns.length} BURN EVENTS`,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">Dashboard</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Live protocol overview — click a card to manage the section.
      </p>

      {!treasurySet && (
        <p className="mb-6 rounded border border-coral/40 bg-coral/5 px-4 py-3 font-sans text-sm text-coral">
          Treasury address is not set — property reservations are disabled.{" "}
          <Link href="/admin/settings" className="underline underline-offset-2">
            Set it in App settings.
          </Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-grid bg-paper p-5 transition-colors hover:border-compass/60"
          >
            <div className="flex items-center justify-between">
              <card.icon size={18} strokeWidth={1.5} className="text-compass" />
              <ArrowRight
                size={14}
                strokeWidth={1.75}
                className="text-ledger transition-transform group-hover:translate-x-1 group-hover:text-compass"
              />
            </div>
            <p className="mt-4 font-mono text-3xl text-navy">{card.value}</p>
            <p className="mt-1 font-sans text-sm font-medium text-navy">{card.label}</p>
            <p
              className={`mt-1.5 font-mono text-[9px] tracking-eyebrow ${
                card.alert ? "text-coral" : "text-ledger"
              }`}
            >
              {card.sub}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-grid bg-paper p-5">
        <p className="eyebrow mb-4">QUICK LINKS</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/settings" className="btn-ghost !bg-paper !px-4 !py-2 !text-[12px]">
            <Settings size={13} strokeWidth={1.5} />
            App settings
          </Link>
          <Link href="/admin/users" className="btn-ghost !bg-paper !px-4 !py-2 !text-[12px]">
            Admin users
          </Link>
          <a
            href="https://basescan.org/address/0xd1a9debed94de40188288a70d4d9bb39bc0cd67a"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !bg-paper !px-4 !py-2 !text-[12px]"
          >
            Staking on Basescan
          </a>
          <a
            href="https://basescan.org/address/0xdf500d8e1ea4528c9a36cf79cbabe37db414f98e"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !bg-paper !px-4 !py-2 !text-[12px]"
          >
            Lending on Basescan
          </a>
        </div>
      </div>
    </div>
  );
}
