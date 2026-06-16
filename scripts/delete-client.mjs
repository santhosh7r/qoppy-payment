// Delete a specific client by email
// Usage: node scripts/delete-client.mjs <email>
import { readFileSync } from "node:fs";
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

async function main() {
  loadEnv();
  const [, , email] = process.argv;
  if (!email) {
    console.error("Usage: node scripts/delete-client.mjs <email>");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { error: delErr } = await sb
    .from("clients")
    .delete()
    .eq("email", email.toLowerCase().trim());

  if (delErr) {
    console.error("Failed to delete client:", delErr.message);
    process.exit(1);
  }

  console.log(`✓ Client deleted: ${email.toLowerCase().trim()}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
