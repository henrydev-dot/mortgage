import fs from "fs";
import path from "path";

// Force dynamic so Next.js doesn't pre-render the list at build time
export const dynamic = "force-dynamic";

export default function AdminEmailsPage() {
  const filePath = path.join(process.cwd(), "emails.txt");
  let emails: string[] = [];

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    emails = content.trim().split("\n").filter(Boolean);
  }

  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line max-w-2xl mx-auto">
        <h1 className="font-display text-3xl text-navy mb-6">Registered Waitlist Emails</h1>
        
        <div className="bg-paper rounded border border-grid overflow-hidden">
          <div className="bg-navy px-6 py-4">
            <span className="font-mono text-xs text-paper/60 uppercase tracking-wider">
              Subscribers List ({emails.length})
            </span>
          </div>
          
          <ul className="divide-y divide-grid">
            {emails.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-ledger">
                No emails registered yet.
              </li>
            ) : (
              emails.map((line, idx) => {
                const parts = line.split(" - ");
                const date = parts[0] ? new Date(parts[0]).toLocaleString() : "";
                const email = parts[1] || line;
                return (
                  <li key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
                    <span className="font-sans text-sm text-navy">{email}</span>
                    <span className="font-mono text-xs text-ledger">{date}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
