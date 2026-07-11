"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Lock, XCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next") || "/admin";
      window.location.href = next.startsWith("/") ? next : "/admin";
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "h-11 w-full rounded border border-grid bg-paper px-3 font-mono text-sm text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-fog p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_24px_70px_-36px_rgba(29,37,84,0.35)]"
      >
        <div className="flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
          <span className="ml-auto font-mono text-[9px] tracking-eyebrow text-ledger">
            MRT://ADMIN
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img src="/brand/mark.svg" alt="" className="h-9 w-9" />
            <div>
              <h1 className="font-display text-xl text-navy">Admin access</h1>
              <p className="font-mono text-[9px] tracking-eyebrow text-ledger">
                RESTRICTED AREA
              </p>
            </div>
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            autoFocus
            className={`${input} mt-5`}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className={`${input} mt-3`}
          />
          <button type="submit" disabled={busy} className="btn-primary mt-4 w-full justify-center disabled:opacity-40">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} strokeWidth={1.75} />}
            Sign in
          </button>
          {error && (
            <p className="mt-3 flex items-center gap-1.5 font-sans text-sm text-coral">
              <XCircle size={14} strokeWidth={1.5} />
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
