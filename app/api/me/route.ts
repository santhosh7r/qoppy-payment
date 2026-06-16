import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin()
    .from("clients")
    .select("id, email, credits, access_status")
    .eq("id", id)
    .single();

  const client = data as Pick<Client, "id" | "email" | "credits" | "access_status"> | null;
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    email: client.email,
    credits: client.credits,
    accessStatus: client.access_status,
  });
}
