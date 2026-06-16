import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { clientIdFromRequest } from "@/lib/auth";
import { fetchCodebase } from "@/lib/codebase-store";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

// Streams the project as a .zip — ONLY for clients with granted access.
// Sources from Supabase `project_files` (deploy-safe: works on serverless hosts
// where there is no local filesystem). Falls back to local files in dev.
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

  const files = await fetchCodebase();
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Project files are not available." },
      { status: 500 }
    );
  }

  const zip = new JSZip();
  const folder = zip.folder(BRAND.product.id) ?? zip;
  for (const f of files) folder.file(f.path, f.content);

  const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(buf as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${BRAND.product.id}.zip"`,
    },
  });
}
