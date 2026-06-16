"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { AccessStatus } from "@/lib/supabase";

export default function NavApp() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<{ credits: number; accessStatus: AccessStatus } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch("/api/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (active) setMe(await res.json());
    }
    load();
    const t = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [router]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const links = [
    { href: "/workspace", label: "My Projects" },
    { href: "/payment", label: "Payment" },
  ];
  const locked = me ? me.accessStatus !== "granted" : true;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-edge bg-ink px-6">
      <div className="flex items-center gap-8">
        <Link href="/workspace" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 transition ${
                  isActive
                    ? "bg-panel text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-md border border-edge px-3 py-1.5">
          <span className="text-muted">Credits</span>{" "}
          <span className="font-semibold text-lime">
            {me ? me.credits.toLocaleString() : "—"}
          </span>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
            locked ? "border-yellow-500/50 text-yellow-400" : "border-lime text-lime"
          }`}
        >
          {locked ? <Lock size={12} /> : <CheckCircle2 size={12} />}
          {locked ? "Locked" : "Unlocked"}
        </span>
        <button
          onClick={signOut}
          className="rounded-md border border-edge px-3 py-1.5 text-xs text-white transition hover:border-lime"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
