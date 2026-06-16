import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { fetchCodebase } from "@/lib/codebase-store";

export const runtime = "nodejs";

// Returns the codebase for any signed-in client (preview). The "locked" state is
// a UX gate driven by access_status — the client can read code but the workspace
// stays locked (pay prompt) until access is granted.
export async function GET(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin()
    .from("clients")
    .select("access_status")
    .eq("id", id)
    .single();
  const client = data as Pick<Client, "access_status"> | null;
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    files: await fetchCodebase(),
    accessStatus: client.access_status,
  });
}
