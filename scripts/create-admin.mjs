// Provision an admin login (stored in the Supabase `admins` table).
// Usage: node scripts/create-admin.mjs <email> <password>
import { readFileSync } from "node:fs";
import { scryptSync, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(f, "utf8");
      for (const line of txt.split("\n")) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const i = line.indexOf("=");
        const k = line.slice(0, i).trim();
        if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
      }
    } catch {
      /* file may not exist */
    }
  }
}

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  loadEnv();
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.mjs <email> <password>");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const row = {
    email: email.toLowerCase().trim(),
    password_hash: hashPassword(password),
  };
  const { error } = await sb.from("admins").upsert(row, { onConflict: "email" });
  if (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Admin ready: ${row.email}`);
}

main();
