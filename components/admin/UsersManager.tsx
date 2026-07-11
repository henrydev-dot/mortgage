"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, Loader2, Trash2, UserPlus, XCircle } from "lucide-react";

interface UserRow {
  username: string;
  createdAt: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});

  const load = useCallback(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setState({ error: "Failed to load." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setState({});
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) setState({ error: data.error || "Failed." });
      else {
        setState({
          ok: data.updated ? `Password updated for ${username}.` : `User ${username} added.`,
        });
        setUsername("");
        setPassword("");
        load();
      }
    } catch {
      setState({ error: "Network error." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (name: string) => {
    setState({});
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    });
    const data = await res.json();
    if (!res.ok) setState({ error: data.error || "Failed." });
    else {
      setState({ ok: `User ${name} removed.` });
      load();
    }
  };

  const input =
    "h-10 w-full rounded border border-grid bg-paper px-3 font-mono text-[12px] text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none";

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">Admin Users</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Classic username + password accounts, stored in the database. Adding
        an existing username changes that user&apos;s password. The first
        account is bootstrapped from ADMIN_USER / ADMIN_KEY in the env.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded border border-grid bg-paper">
          <div className="border-b border-grid bg-fog px-5 py-3">
            <span className="font-mono text-[9px] tracking-eyebrow text-ledger">
              ACCOUNTS ({users.length})
            </span>
          </div>
          {loading ? (
            <p className="p-5 font-mono text-[11px] text-ledger">LOADING…</p>
          ) : (
            <ul className="divide-y divide-grid">
              {users.map((u) => (
                <li key={u.username} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="font-mono text-[13px] text-navy">{u.username}</p>
                    <p className="font-mono text-[9px] tracking-wider text-ledger">
                      SINCE {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {users.length > 1 && (
                    <button
                      onClick={() => remove(u.username)}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-coral underline-offset-2 hover:underline"
                    >
                      <Trash2 size={12} strokeWidth={1.75} />
                      REMOVE
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={submit} className="h-fit rounded border border-grid bg-paper p-5">
          <p className="eyebrow mb-4">ADD USER / CHANGE PASSWORD</p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className={input}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            required
            minLength={8}
            className={`${input} mt-3`}
          />
          <button type="submit" disabled={busy} className="btn-primary mt-4 w-full justify-center disabled:opacity-40">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} strokeWidth={1.75} />}
            Save user
          </button>
        </form>
      </div>

      {state.error && (
        <p className="mt-4 flex items-center gap-1.5 font-sans text-sm text-coral">
          <XCircle size={14} strokeWidth={1.5} /> {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-4 flex items-center gap-1.5 font-sans text-sm text-compass">
          <Check size={14} strokeWidth={1.75} /> {state.ok}
        </p>
      )}
    </div>
  );
}
