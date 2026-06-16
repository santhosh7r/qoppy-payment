// Upload the project's source files into Supabase `project_files` so the app can
// serve the viewer + .zip download on a deployed host (no local filesystem).
// Usage: node scripts/upload-codebase.mjs [path-to-project]
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(f, "utf8").split("\n")) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const i = line.indexOf("=");
        const k = line.slice(0, i).trim();
        if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
      }
    } catch {}
  }
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".vite", "coverage", ".turbo", ".vercel",
]);
const EXT_LANG = {
  ".js": "javascript", ".jsx": "jsx", ".mjs": "javascript", ".cjs": "javascript",
  ".ts": "typescript", ".tsx": "tsx", ".py": "python", ".json": "json", ".md": "markdown",
  ".css": "css", ".scss": "scss", ".html": "html", ".sql": "sql", ".sh": "bash",
  ".yml": "yaml", ".yaml": "yaml", ".toml": "toml", ".txt": "text", ".svg": "xml",
};
const ALLOW_NAMES = new Set([".gitignore", "Dockerfile", "Procfile"]);
const DENY_NAMES = new Set([
  ".env", ".env.local", ".env.production", ".env.development",
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
]);
const MAX_FILE_BYTES = 200 * 1024;

function languageFor(name) {
  if (DENY_NAMES.has(name)) return null;
  if (ALLOW_NAMES.has(name)) return "text";
  return EXT_LANG[path.extname(name).toLowerCase()] ?? null;
}
function looksBinary(s) {
  const n = Math.min(s.length, 1024);
  for (let i = 0; i < n; i++) if (s.charCodeAt(i) === 0) return true;
  return false;
}
function walk(dir, rel, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    const rp = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(abs, rp, out);
      continue;
    }
    if (!e.isFile()) continue;
    const lang = languageFor(e.name);
    if (!lang) continue;
    try {
      if (statSync(abs).size > MAX_FILE_BYTES) continue;
      const content = readFileSync(abs, "utf8");
      if (looksBinary(content)) continue;
      out.push({ path: rp, language: lang, content });
    } catch {}
  }
}

async function main() {
  loadEnv();
  const root = process.argv[2] || path.join(process.cwd(), "vcc-timesheet-app");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const files = [];
  walk(root, "", files);
  files.sort((a, b) => a.path.localeCompare(b.path));
  console.log(`Found ${files.length} files under ${root}`);

  const sb = createClient(url, key, { auth: { persistSession: false } });
  // Replace the table contents.
  await sb.from("project_files").delete().neq("path", "");
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);
    const { error } = await sb.from("project_files").upsert(batch, { onConflict: "path" });
    if (error) {
      console.error("Upload failed:", error.message);
      process.exit(1);
    }
    console.log(`  uploaded ${Math.min(i + 100, files.length)}/${files.length}`);
  }
  console.log("✓ Codebase uploaded to Supabase (project_files).");
}

main();
