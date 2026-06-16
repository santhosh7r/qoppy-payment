"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccessStatus } from "@/lib/supabase";

type Row = {
  id: string;
  email: string;
  credits: number;
  access_status: AccessStatus;
  created_at: string;
};

// Backend-only console. Not linked from any client-facing page.
export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/clients");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setRows(data.clients ?? []);
    setAuthed(true);
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Login failed");
      return;
    }
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setRows([]);
  }

  async function setStatus(row: Row, status: AccessStatus) {
    setBusy(row.id);
    await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: row.id, status }),
    });
    await load();
    setBusy(null);
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (authed) {
      const t = setInterval(load, 5000);
      return () => clearInterval(t);
    }
  }, [authed, load]);

  if (authed === null) {
    return (
      <main className="grid-bg min-h-screen">
        <section className="mx-auto max-w-sm px-6 py-24 text-muted">Loading…</section>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="grid-bg min-h-screen">
        <section className="mx-auto max-w-sm px-6 py-24">
          <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
          <p className="mt-2 text-sm text-muted">Staff sign in.</p>
          <form onSubmit={login} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qoppy.com"
              className="w-full rounded-md border border-edge bg-ink px-3 py-2.5 text-white outline-none focus:border-lime"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-md border border-edge bg-ink px-3 py-2.5 text-white outline-none focus:border-lime"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button className="w-full rounded-md bg-lime px-4 py-3 text-sm font-semibold text-ink hover:bg-lime-soft">
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="grid-bg min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-md border border-edge px-3 py-1.5 text-xs text-white hover:border-lime"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-edge px-3 py-1.5 text-xs text-white hover:border-lime"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Clients */}
        <div className="mt-8 overflow-hidden rounded-xl border border-edge">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">
                      No clients yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-panel/50">
                    <td className="px-4 py-3 text-white">{r.email}</td>
                    <td className="px-4 py-3 text-muted">{r.credits.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.access_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.access_status === "granted" ? (
                        <button
                          onClick={() => setStatus(r, "locked")}
                          disabled={busy === r.id}
                          className="rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-white hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                        >
                          {busy === r.id ? "…" : "Revoke"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(r, "granted")}
                          disabled={busy === r.id}
                          className="rounded-md bg-lime px-3 py-1.5 text-xs font-semibold text-ink hover:bg-lime-soft disabled:opacity-50"
                        >
                          {busy === r.id ? "…" : "Grant access"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        <p className="mt-4 text-xs text-muted">
          Clients in <span className="text-yellow-400">processing</span> have spent
          credits and are awaiting your approval.
        </p>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: AccessStatus }) {
  const map = {
    granted: "border-lime text-lime",
    processing: "border-yellow-500/60 text-yellow-400",
    locked: "border-edge text-muted",
  } as const;
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs ${map[status]}`}>
      {status}
    </span>
  );
}
