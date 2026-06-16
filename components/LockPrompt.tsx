"use client";

import { Lock } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function LockPrompt({
  open,
  onClose,
  onPay,
}: {
  open: boolean;
  onClose: () => void;
  onPay: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-edge bg-panel p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Lock size={36} className="mx-auto text-lime" />
        <h2 className="mt-3 text-lg font-semibold text-white">Locked project</h2>
        <p className="mt-2 text-sm text-muted">
          <strong>{BRAND.product.title}</strong> is locked. Pay to unlock the full
          source code and download it as a .zip.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-edge px-4 py-2.5 text-sm font-semibold text-white transition hover:border-lime"
          >
            Not now
          </button>
          <button
            onClick={onPay}
            className="flex-1 rounded-md bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-lime-soft"
          >
            Pay to unlock
          </button>
        </div>
      </div>
    </div>
  );
}
