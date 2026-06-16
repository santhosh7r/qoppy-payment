import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type AccessStatus } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

const VALID: AccessStatus[] = ["locked", "processing", "granted"];

// Backend-only: set a client's access status (grant / revoke).
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, status } = await req.json();
  if (!clientId || !VALID.includes(status)) {
    return NextResponse.json({ error: "clientId and valid status required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("clients")
    .update({ access_status: status })
    .eq("id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
