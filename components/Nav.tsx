import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-edge/60 bg-ink/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/#capabilities" className="hover:text-white">Capabilities</Link>
          <Link href="/#how" className="hover:text-white">How it works</Link>
          <Link href="/#pricing" className="hover:text-white">Pricing</Link>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-soft"
        >
          Sign in →
        </Link>
      </nav>
    </header>
  );
}
