"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/workspace");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="grid-bg relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-lime/20 blur-[120px]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        {/* Brand */}
        <a href="/" className="mb-10 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-ink">
            <span className="h-3 w-3 rounded-full bg-ink" />
          </span>
          <span className="text-xl font-semibold tracking-tight">{BRAND.name}</span>
        </a>

        {/* Card */}
        <div className="rounded-2xl border border-edge bg-panel/70 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            Access your private codebase workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm text-muted">
              Email
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-md border border-edge bg-ink px-3 py-2.5 text-white outline-none transition placeholder:text-muted/50 focus:border-lime"
              />
            </label>

            <label className="block text-sm text-muted">
              Password
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-edge bg-ink px-3 py-2.5 pr-16 text-white outline-none transition placeholder:text-muted/50 focus:border-lime"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted transition hover:text-lime"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-lime px-4 py-3 text-sm font-semibold text-ink transition hover:bg-lime-soft disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          <a href="/" className="hover:text-white">← Back to home</a>
        </p>
      </div>
    </main>
  );
}
