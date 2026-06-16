import fs from "node:fs";
import path from "node:path";

export type CodeFile = { path: string; language: string; content: string };

// Root of the codebase to display. Override with CODEBASE_DIR if it lives elsewhere.
const ROOT =
  process.env.CODEBASE_DIR || path.join(process.cwd(), "vcc-timesheet-app");

// Directories we never descend into (deps, build output, VCS, caches).
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".vite",
  "coverage",
  ".turbo",
  ".vercel",
]);

// Only these extensions are shown (keeps out binaries: pdf, png, docx, etc.).
const EXT_LANG: Record<string, string> = {
  ".js": "javascript",
  ".jsx": "jsx",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".py": "python",
  ".json": "json",
  ".md": "markdown",
  ".css": "css",
  ".scss": "scss",
  ".html": "html",
  ".sql": "sql",
  ".sh": "bash",
  ".yml": "yaml",
  ".yaml": "yaml",
  ".toml": "toml",
  ".txt": "text",
  ".svg": "xml",
};

// Specific filenames to show even without a listed extension.
const ALLOW_NAMES = new Set([".gitignore", "Dockerfile", "Procfile"]);

// Never read these (secrets or huge generated lockfiles).
const DENY_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

const MAX_FILE_BYTES = 200 * 1024; // skip files larger than 200 KB
const MAX_FILES = 600;

function languageFor(name: string): string | null {
  if (DENY_NAMES.has(name)) return null;
  if (ALLOW_NAMES.has(name)) return name.endsWith("example") ? "bash" : "text";
  const ext = path.extname(name).toLowerCase();
  return EXT_LANG[ext] ?? null;
}

// Treat a file as binary if it contains a NUL byte in the first 1KB.
function looksBinary(content: string): boolean {
  const n = Math.min(content.length, 1024);
  for (let i = 0; i < n; i++) {
    if (content.charCodeAt(i) === 0) return true;
  }
  return false;
}

function walk(dir: string, rel: string, out: CodeFile[]) {
  if (out.length >= MAX_FILES) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const e of entries) {
    if (out.length >= MAX_FILES) return;
    const abs = path.join(dir, e.name);
    const relPath = rel ? `${rel}/${e.name}` : e.name;

    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(abs, relPath, out);
      continue;
    }
    if (!e.isFile()) continue;

    const lang = languageFor(e.name);
    if (!lang) continue;

    try {
      const stat = fs.statSync(abs);
      if (stat.size > MAX_FILE_BYTES) continue;
      const content = fs.readFileSync(abs, "utf8");
      if (looksBinary(content)) continue;
      out.push({ path: relPath, language: lang, content });
    } catch {
      /* unreadable — skip */
    }
  }
}

let cache: CodeFile[] | null = null;

export function loadCodebase(): CodeFile[] {
  if (cache) return cache;
  const out: CodeFile[] = [];
  if (fs.existsSync(ROOT)) walk(ROOT, "", out);
  out.sort((a, b) => a.path.localeCompare(b.path));
  cache = out;
  return out;
}
