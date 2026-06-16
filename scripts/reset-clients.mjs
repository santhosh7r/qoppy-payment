// One-off: delete ALL clients (admins are untouched), then create one client.
// Usage: node scripts/reset-clients.mjs <email> <password> [credits]
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
    console.error("Usage: node scripts/reset-clients.mjs <email> <password> [credits]");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Delete all clients (recharges cascade via FK). Admins table is NOT touched.
  const { data: before } = await sb.from("clients").select("email");
  console.log("Existing clients:", (before ?? []).map((c) => c.email));

  const { error: delErr } = await sb
    .from("clients")
    .delete()
    .not("id", "is", null); // matches every row
  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }
  console.log("✓ Deleted all clients");

  const row = {
    email: email.toLowerCase().trim(),
    password_hash: hashPassword(password),
    credits: Number(creditsArg ?? 0),
  };
  const { error: insErr } = await sb.from("clients").insert(row);
  if (insErr) {
    console.error("Insert failed:", insErr.message);
    process.exit(1);
  }
  console.log(`✓ Client created: ${row.email} (credits: ${row.credits})`);
}

main();
