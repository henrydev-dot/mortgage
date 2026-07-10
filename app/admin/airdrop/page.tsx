import { AIRDROP, MRT_TOKEN } from "@/lib/airdrop";
import {
  loadApplications,
  loadReferralRegs,
  type Application,
} from "@/lib/airdropStore";

// Force dynamic so Next.js doesn't pre-render the lists at build time
export const dynamic = "force-dynamic";

interface ReferrerRow {
  address: string;
  registeredAt?: string;
  hits?: number;
  referred: number;
  owed: number;
  applied: boolean;
}

export default function AdminAirdropPage() {
  const appsMap = loadApplications();
  const regs = loadReferralRegs();

  const apps: Application[] = Object.values(appsMap).sort((a, b) =>
    a.ts < b.ts ? 1 : -1
  );

  // Referrer summary: anyone who generated a link OR is referenced as ref
  const referrers = new Map<string, ReferrerRow>();
  for (const reg of Object.values(regs)) {
    referrers.set(reg.address.toLowerCase(), {
      address: reg.address,
      registeredAt: reg.ts,
      hits: reg.hits,
      referred: 0,
      owed: 0,
      applied: Boolean(appsMap[reg.address.toLowerCase()]),
    });
  }
  for (const app of apps) {
    if (!app.ref) continue;
    const key = app.ref.toLowerCase();
    const row = referrers.get(key) ?? {
      address: app.ref,
      referred: 0,
      owed: 0,
      applied: Boolean(appsMap[key]),
    };
    row.referred += 1;
    row.owed = row.referred * AIRDROP.referralBonus;
    referrers.set(key, row);
  }
  const referrerRows = Array.from(referrers.values()).sort(
    (a, b) => b.referred - a.referred
  );

  const totalPayout =
    apps.length * AIRDROP.claimAmount +
    apps.filter((a) => a.ref).length * AIRDROP.referralBonus;

  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line mx-auto max-w-6xl space-y-10">
        <div>
          <h1 className="mb-2 font-display text-3xl text-navy">
            Airdrop Applications
          </h1>
          <p className="font-sans text-sm text-ledger">
            Manual distribution: send{" "}
            {AIRDROP.claimAmount.toLocaleString("en-US")} MRT per approved
            wallet, +{AIRDROP.referralBonus} MRT to the referrer per referred
            application. Token: {MRT_TOKEN.address}
          </p>
        </div>

        {/* Applications */}
        <div className="overflow-hidden rounded border border-grid bg-paper">
          <div className="bg-navy px-6 py-4">
            <span className="font-mono text-xs uppercase tracking-wider text-paper/60">
              Applications ({apps.length}) · payout total{" "}
              {totalPayout.toLocaleString("en-US")} MRT
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid bg-fog font-mono text-[10px] uppercase tracking-wider text-ledger">
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Send</th>
                  <th className="px-4 py-3">Referred by</th>
                  <th className="px-4 py-3">Tweet</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-ledger">
                      No applications yet.
                    </td>
                  </tr>
                ) : (
                  apps.map((app) => (
                    <tr key={app.address} className="font-mono text-[12px] text-navy">
                      <td className="px-4 py-3">{app.address}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {AIRDROP.claimAmount.toLocaleString("en-US")} MRT
                      </td>
                      <td className="px-4 py-3">
                        {app.ref ? (
                          <span className="text-compass">{app.ref}</span>
                        ) : (
                          <span className="text-ledger">—</span>
                        )}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3">
                        {app.tweetUrl ? (
                          <a
                            href={app.tweetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-compass underline underline-offset-2"
                          >
                            {app.tweetUrl}
                          </a>
                        ) : (
                          <span className="text-ledger">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ledger">
                        {new Date(app.ts).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Referrers */}
        <div className="overflow-hidden rounded border border-grid bg-paper">
          <div className="bg-navy px-6 py-4">
            <span className="font-mono text-xs uppercase tracking-wider text-paper/60">
              Referrers ({referrerRows.length}) · bonus owed{" "}
              {referrerRows
                .reduce((sum, r) => sum + r.owed, 0)
                .toLocaleString("en-US")}{" "}
              MRT
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid bg-fog font-mono text-[10px] uppercase tracking-wider text-ledger">
                  <th className="px-4 py-3">Referrer wallet</th>
                  <th className="px-4 py-3">Link generated</th>
                  <th className="px-4 py-3">Referred apps</th>
                  <th className="px-4 py-3">Bonus owed</th>
                  <th className="px-4 py-3">Applied themselves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid">
                {referrerRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-ledger">
                      No referral links generated yet.
                    </td>
                  </tr>
                ) : (
                  referrerRows.map((row) => (
                    <tr key={row.address} className="font-mono text-[12px] text-navy">
                      <td className="px-4 py-3">{row.address}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ledger">
                        {row.registeredAt
                          ? new Date(row.registeredAt).toLocaleString()
                          : "— (never generated, used directly)"}
                      </td>
                      <td className="px-4 py-3">{row.referred}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.owed > 0 ? (
                          <span className="text-compass">{row.owed} MRT</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">{row.applied ? "YES" : "NO"}</td>
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
