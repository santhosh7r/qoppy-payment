"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, ShieldCheck, X, CreditCard, Key, AlertCircle } from "lucide-react";
import { BRAND, type RechargePack } from "@/lib/brand";

type Phase = "confirm" | "card" | "otp" | "processing" | "success";

export default function CheckoutModal({
  open,
  pack,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pack: RechargePack | null;
  onClose: () => void;
  // Performs the actual (simulated) recharge. Resolves true on success.
  onConfirm: (amount: number, cardDetails: {
    cardNumber: string;
    cardholderName: string;
    expiry: string;
    cvv: string;
    otp: string;
    expectedOtp: string;
  }) => Promise<boolean>;
}) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [error, setError] = useState<string | null>(null);
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  
  // OTP State
  const [otp, setOtp] = useState("");

  // Status message during processing
  const [processingStatus, setProcessingStatus] = useState("Securing transaction channel...");

  useEffect(() => {
    if (open) {
      setPhase("confirm");
      setError(null);
      setCardNumber("");
      setCardholderName("");
      setExpiry("");
      setCvv("");
      setOtp("");
    }
  }, [open, pack]);

  if (!open || !pack) return null;

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const trimmed = value.slice(0, 16);
    const parts = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      parts.push(trimmed.substring(i, i + 4));
    }
    setCardNumber(parts.length > 0 ? parts.join(" ") : trimmed);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const trimmed = value.slice(0, 4);
    if (trimmed.length >= 2) {
      setExpiry(`${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}`);
    } else {
      setExpiry(trimmed);
    }
  };

  // Format CVV (3 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    setCvv(value.slice(0, 3));
  };

  // Move from confirm screen to card details screen
  const proceedToCard = () => {
    setError(null);
    setPhase("card");
  };

  // Move from card details to OTP verification
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Simple validation
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.length !== 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!cardholderName.trim()) {
      setError("Please enter the cardholder's name.");
      return;
    }
    if (expiry.length !== 5) {
      setError("Please enter a valid expiration date (MM/YY).");
      return;
    }
    const [month, year] = expiry.split("/");
    const m = parseInt(month, 10);
    if (isNaN(m) || m < 1 || m > 12) {
      setError("Expiration month must be between 01 and 12.");
      return;
    }
    if (cvv.length !== 3) {
      setError("Please enter a valid 3-digit CVV.");
      return;
    }

    setPhase("otp");
  };

  // Handle final validation and API submission
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setPhase("processing");
    setProcessingStatus("Securing transaction channel...");
    
    // Realistic multi-step simulated processing beats
    setTimeout(() => setProcessingStatus("Authorizing transaction with bank..."), 800);
    setTimeout(() => setProcessingStatus("Processing payment..."), 1600);
    setTimeout(() => setProcessingStatus("Crediting your account balance..."), 2400);

    await new Promise((r) => setTimeout(r, 3200));

    const ok = await onConfirm(pack.credits, {
      cardNumber: cardNumber.replace(/\s/g, ""),
      cardholderName,
      expiry,
      cvv,
      otp,
      expectedOtp: otp,
    });

    if (!ok) {
      setError("Transaction was declined. Please try again.");
      setPhase("card");
      return;
    }

    setPhase("success");
    // Auto close modal after showing success
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-edge bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck size={16} className="text-lime" /> Secure checkout
          </span>
          {(phase === "confirm" || phase === "card") && (
            <button onClick={onClose} className="text-muted hover:text-white" aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Phase: Confirm Pack */}
        {phase === "confirm" && (
          <div className="p-5">
            <div className="rounded-lg border border-edge bg-ink/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Product package</span>
                <span className="text-white font-medium">{BRAND.product.title} Pack</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">Recharge credits</span>
                <span className="text-white font-medium">+{pack.credits.toLocaleString()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
                <span className="font-semibold text-white">Amount due</span>
                <span className="text-xl font-semibold text-lime">${pack.usd}</span>
              </div>
            </div>

            <button
              onClick={proceedToCard}
              className="mt-4 w-full rounded-md bg-lime px-4 py-3 text-sm font-semibold text-ink transition hover:bg-lime-soft"
            >
              Proceed to payment →
            </button>
            <p className="mt-3 text-center text-[11px] text-muted">
              Demo mode — simulated gateway.
            </p>
          </div>
        )}

        {/* Phase: Card Input */}
        {phase === "card" && (
          <form onSubmit={handleCardSubmit} className="p-5">
            {/* Interactive Live Card Preview */}
            <div className="relative mb-5 h-44 w-full overflow-hidden rounded-xl bg-gradient-to-br from-lime/20 via-panel to-ink border border-edge p-5 flex flex-col justify-between shadow-lg">
              <div className="absolute right-4 top-4 h-8 w-12 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[9px] font-bold text-muted/80">
                {cardNumber.startsWith("4") ? (
                  <span className="text-blue-400 font-bold italic text-sm">VISA</span>
                ) : cardNumber.startsWith("5") ? (
                  <span className="text-red-400 font-bold italic text-sm">MC</span>
                ) : (
                  <span>SECURE</span>
                )}
              </div>
              
              <div className="flex items-start justify-between">
                {/* Card Chip Sim */}
                <div className="h-7 w-9 rounded-md bg-gradient-to-br from-yellow-600 to-yellow-300 opacity-80 shadow-inner" />
              </div>

              <div>
                {/* Live Card Number */}
                <div className="font-mono text-lg tracking-widest text-white">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
                  <div className="truncate max-w-[70%]">
                    <div className="text-[8px] text-muted/60">Cardholder</div>
                    <div className="font-mono text-white truncate font-medium">
                      {cardholderName || "CARDHOLDER NAME"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-muted/60">Expires</div>
                    <div className="font-mono text-white font-medium">{expiry || "MM/YY"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-edge bg-ink px-3 py-2 text-sm text-white outline-none focus:border-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">Card Number</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    placeholder="4111 1111 1111 1111"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full rounded-md border border-edge bg-ink pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-lime font-mono"
                  />
                  <CreditCard size={16} className="absolute left-3.5 top-3 text-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="mt-1 w-full rounded-md border border-edge bg-ink px-3 py-2 text-sm text-white outline-none focus:border-lime font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">CVV</label>
                  <input
                    type="password"
                    required
                    placeholder="123"
                    value={cvv}
                    onChange={handleCvvChange}
                    className="mt-1 w-full rounded-md border border-edge bg-ink px-3 py-2 text-sm text-white outline-none focus:border-lime font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("confirm")}
                className="rounded-md border border-edge px-4 py-2.5 text-sm font-semibold text-white transition hover:border-lime"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-lime-soft"
              >
                Request OTP code
              </button>
            </div>
          </form>
        )}

        {/* Phase: OTP Input */}
        {phase === "otp" && (
          <form onSubmit={handleOtpSubmit} className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-lime/10 text-lime mb-3">
                <Key size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Security Verification</h3>
              <p className="mt-1.5 text-xs text-muted max-w-xs">
                A verification code has been dispatched to the mobile number registered with card ending in{" "}
                <span className="font-semibold text-white">
                  {cardNumber.slice(-4)}
                </span>
                .
              </p>
            </div>

            {/* OTP Input */}
            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted text-center">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-md border border-edge bg-ink px-4 py-3 text-center text-lg font-bold font-mono tracking-widest text-white outline-none focus:border-lime"
              />
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("card")}
                className="rounded-md border border-edge px-4 py-2.5 text-sm font-semibold text-white transition hover:border-lime"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-lime-soft"
              >
                Verify & Pay ${pack.usd}
              </button>
            </div>
          </form>
        )}

        {/* Phase: Processing */}
        {phase === "processing" && (
          <div className="p-8 text-center flex flex-col items-center">
            <Loader2 size={40} className="animate-spin text-lime" />
            <p className="mt-4 text-base font-semibold text-white">Processing payment…</p>
            <p className="mt-1 text-xs text-muted h-4">{processingStatus}</p>
          </div>
        )}

        {/* Phase: Success */}
        {phase === "success" ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-lime animate-bounce" />
            <p className="mt-3 text-lg font-semibold text-white">Payment successful</p>
            <p className="mt-1 text-sm text-muted">
              {pack.credits.toLocaleString()} credits added to your balance.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
