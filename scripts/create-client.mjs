// Provision a client login (there is no signup in the app).
// Usage: node scripts/create-client.mjs <email> <password> [credits]
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
  const [, , email, password, creditsArg] = process.argv;
  if (!email || !password) {
    console.error("Usage: node scripts/create-client.mjs <email> <password> [credits]");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const row = {
    email: email.toLowerCase().trim(),
    password_hash: hashPassword(password),
    credits: Number(creditsArg ?? 0),
  };

  // Upsert by email so re-running resets the password/credits.
  const { error } = await sb.from("clients").upsert(row, { onConflict: "email" });
  if (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Client ready: ${row.email} (credits: ${row.credits})`);
}

main();
