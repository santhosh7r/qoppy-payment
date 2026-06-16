import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { buildProjectZip, projectDirExists } from "@/lib/download-archive";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

// Streams the ENTIRE project folder as a .zip — ONLY for clients with granted access.
export async function GET(req: NextRequest) {
  const id = clientIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin()
    .from("clients")
    .select("access_status")
    .eq("id", id)
    .single();
  const client = data as Pick<Client, "access_status"> | null;
  if (!client || client.access_status !== "granted") {
    return NextResponse.json({ error: "Access not granted" }, { status: 403 });
  }

  if (!projectDirExists()) {
    return NextResponse.json(
      { error: "Project files are not available on the server." },
      { status: 500 }
    );
  }

  const buf = await buildProjectZip();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(buf as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${BRAND.product.id}.zip"`,
    },
  });
}
