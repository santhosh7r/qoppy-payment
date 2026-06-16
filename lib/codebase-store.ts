import { supabaseAdmin } from "./supabase";
import { loadCodebase, type CodeFile } from "./codebase";

// Deploy-safe codebase source: reads files from the Supabase `project_files`
// table (uploaded via scripts/upload-codebase.mjs). Falls back to the local
// filesystem in dev / before the upload has run.
let cache: CodeFile[] | null = null;

export async function fetchCodebase(): Promise<CodeFile[]> {
  if (cache) return cache;
  try {
    const { data, error } = await supabaseAdmin()
      .from("project_files")
      .select("path, language, content")
      .order("path");
    if (!error && data && data.length > 0) {
      cache = data as CodeFile[];
      return cache;
    }
  } catch {
    /* table may not exist yet — fall back */
  }
  // Local filesystem fallback (not cached, so it picks up the upload later).
  return loadCodebase();
}
