import fs from "fs";
import path from "path";
import { AIRDROP, MRT_TOKEN } from "@/lib/airdrop";

// Force dynamic so Next.js doesn't pre-render the list at build time
export const dynamic = "force-dynamic";

interface Application {
  address: string;
  ts: string;
  ip?: string;
  ref?: string;
  tweetUrl?: string;
  status: string;
}

export default function AdminAirdropPage() {
  const filePath = path.join(process.cwd(), "airdrop-applications.json");
  let apps: Application[] = [];

  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
        string,
        Application
      >;
      apps = Object.values(parsed).sort((a, b) => (a.ts < b.ts ? 1 : -1));
    } catch {
      apps = [];
    }
  }

  const referralTotals = new Map<string, number>();
  for (const app of apps) {
    if (app.ref) {
      const key = app.ref.toLowerCase();
      referralTotals.set(key, (referralTotals.get(key) || 0) + 1);
    }
  }

  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line mx-auto max-w-5xl">
        <h1 className="mb-2 font-display text-3xl text-navy">
          Airdrop Applications
        </h1>
        <p className="mb-6 font-sans text-sm text-ledger">
          Manual distribution: send {AIRDROP.claimAmount.toLocaleString("en-US")}{" "}
          MRT per approved wallet, +{AIRDROP.referralBonus} MRT to the referrer
          per referred application. Token: {MRT_TOKEN.address}
        </p>

        <div className="overflow-hidden rounded border border-grid bg-paper">
          <div className="bg-navy px-6 py-4">
            <span className="font-mono text-xs uppercase tracking-wider text-paper/60">
              Applications ({apps.length}) · payout total{" "}
              {(
                apps.length * AIRDROP.claimAmount +
                apps.filter((a) => a.ref).length * AIRDROP.referralBonus
              ).toLocaleString("en-US")}{" "}
              MRT
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grid bg-fog font-mono text-[10px] uppercase tracking-wider text-ledger">
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Send</th>
                  <th className="px-4 py-3">Referred by</th>
                  <th className="px-4 py-3">Referrals</th>
                  <th className="px-4 py-3">Tweet</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-ledger">
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
                      <td className="px-4 py-3 text-ledger">{app.ref || "—"}</td>
                      <td className="px-4 py-3">
                        {referralTotals.get(app.address.toLowerCase())
                          ? `${referralTotals.get(app.address.toLowerCase())} × +${AIRDROP.referralBonus} MRT`
                          : "—"}
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
      </div>
    </div>
  );
}
