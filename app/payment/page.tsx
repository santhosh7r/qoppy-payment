"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavApp from "@/components/NavApp";
import CheckoutModal from "@/components/CheckoutModal";
import { CheckCircle2 } from "lucide-react";
import { BRAND, type RechargePack } from "@/lib/brand";
import type { AccessStatus } from "@/lib/supabase";

export default function Payment() {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("locked");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [checkoutPack, setCheckoutPack] = useState<RechargePack | null>(null);

  const price = BRAND.product.priceCredits;
  const canUnlock = credits >= price;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const me = await res.json();
    setCredits(me.credits);
    setAccessStatus(me.accessStatus);
    setLoaded(true);
  }, [router]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  // Runs the simulated recharge for the checkout modal; resolves true on success.
  async function doRecharge(amount: number, paymentId: string, otp: string): Promise<boolean> {
    const res = await fetch("/api/recharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, paymentId, otp }),
    });
    const data = await res.json();
    if (!res.ok) return false;
    setCredits(data.credits);
    return true;
  }

  async function unlock() {
    setBusy("unlock");
    setError(null);
    const res = await fetch("/api/access/request", { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Could not unlock");
    else setAccessStatus(data.accessStatus);
    setBusy(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <NavApp />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
        <p className="mt-1 text-sm text-muted">
          Recharge credits and unlock <strong>{BRAND.product.title}</strong>.
        </p>

        {!loaded ? (
          <p className="mt-10 text-sm text-muted">Loading…</p>
        ) : accessStatus === "granted" ? (
          <div className="mt-8 rounded-xl border border-lime bg-panel/60 p-8 text-center glow">
            <CheckCircle2 size={40} className="mx-auto text-lime" />
            <p className="mt-3 text-lg font-semibold text-white">Project unlocked</p>
            <p className="mt-1 text-sm text-muted">
              Your codebase is unlocked. Open it to browse and download.
            </p>
            <button
              onClick={() => router.push("/workspace")}
              className="mt-6 rounded-md bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lime-soft"
            >
              Open My Projects →
            </button>
          </div>
        ) : accessStatus === "processing" ? (
          <div className="mt-8 rounded-xl border border-edge bg-panel/60 p-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-lime" />
            <p className="text-lg font-semibold text-white">Payment received</p>
            <p className="mt-1 text-sm text-muted">
              Your access is being finalized. This page updates automatically once
              it&apos;s live.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Recharge */}
            <div className="rounded-xl border border-edge bg-panel/60 p-6">
              <h2 className="text-sm font-semibold text-white">Recharge credits</h2>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">Balance</span>
                <span className="font-semibold text-lime">{credits.toLocaleString()} credits</span>
              </div>
              <div className="mt-4 space-y-2">
                {BRAND.rechargePacks.map((pack) => (
                  <button
                    key={pack.credits}
                    onClick={() => setCheckoutPack(pack)}
                    className="flex w-full items-center justify-between rounded-md border border-edge px-4 py-3 text-sm transition hover:border-lime"
                  >
                    <span className="font-semibold text-white">
                      {pack.credits.toLocaleString()} credits
                    </span>
                    <span className="rounded bg-lime px-2 py-0.5 text-xs font-semibold text-ink">
                      Pay ${pack.usd}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted">
                Demo mode — no card details collected, no real charge.
              </p>
            </div>

            {/* Unlock */}
            <div className="rounded-xl border border-edge bg-panel/60 p-6">
              <h2 className="text-sm font-semibold text-white">Unlock project</h2>
              <p className="mt-2 text-sm text-muted">{BRAND.product.blurb}</p>
              <p className="mt-4 text-3xl font-semibold">
                {price.toLocaleString()} <span className="text-base text-muted">credits</span>
              </p>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              <button
                onClick={unlock}
                disabled={!canUnlock || !!busy}
                className="mt-4 w-full rounded-md bg-lime px-4 py-3 text-sm font-semibold text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === "unlock"
                  ? "Unlocking…"
                  : canUnlock
                  ? "Unlock now"
                  : `Need ${(price - credits).toLocaleString()} more credits`}
              </button>
            </div>
          </div>
        )}
      </main>

      <CheckoutModal
        open={!!checkoutPack}
        pack={checkoutPack}
        onClose={() => setCheckoutPack(null)}
        onConfirm={doRecharge}
      />
    </div>
  );
}
