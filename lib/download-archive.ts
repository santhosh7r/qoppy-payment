import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { BRAND } from "./brand";

// Directory that gets packaged for the client download. Defaults to the
// d4Insights project folder; override with DOWNLOAD_DIR (or CODEBASE_DIR).
const ROOT =
  process.env.DOWNLOAD_DIR ||
  process.env.CODEBASE_DIR ||
  path.join(process.cwd(), "d4Insights");

// Never package these: dependencies, VCS internals, build caches. Everything
// else in the folder (source, public assets, dist, docs, lockfiles, configs)
// is included so the client gets the entire project.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vite",
  ".turbo",
  ".vercel",
  "coverage",
]);

// Secrets that must not leave the server even though the rest of the folder does.
const SKIP_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

export function projectDirExists(): boolean {
  return fs.existsSync(ROOT);
}

function addDir(zip: JSZip, dir: string, rel: string) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rp = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      addDir(zip, abs, rp);
    } else if (e.isFile()) {
      if (SKIP_FILES.has(e.name)) continue;
      try {
        zip.file(rp, fs.readFileSync(abs)); // Buffer — binary-safe
      } catch {
        /* unreadable — skip */
      }
    }
  }
}

// Builds a .zip of the ENTIRE project folder, nested under the product id.
export async function buildProjectZip(): Promise<Uint8Array> {
  const zip = new JSZip();
  addDir(zip, ROOT, BRAND.product.id);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
