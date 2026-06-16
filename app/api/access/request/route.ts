import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

// Client spends credits to request access. Status moves to "processing";
// final approval happens in the backend (client never sees that step).
export async function POST(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("clients")
    .select("credits, access_status")
    .eq("id", id)
    .single();
  const client = data as Pick<Client, "credits" | "access_status"> | null;
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (client.access_status === "granted") {
    return NextResponse.json({ ok: true, accessStatus: "granted" });
  }
  if (client.access_status === "processing") {
    return NextResponse.json({ ok: true, accessStatus: "processing" });
  }

  const price = BRAND.product.priceCredits;
  if (client.credits < price) {
    return NextResponse.json(
      { error: `Not enough credits. ${price} required.` },
      { status: 400 }
    );
  }

  const { error } = await sb
    .from("clients")
    .update({ credits: client.credits - price, access_status: "processing" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, accessStatus: "processing" });
}
