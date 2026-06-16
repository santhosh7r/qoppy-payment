import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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

async function run() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing supabase credentials");
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  
  const { data: admins, error: adminErr } = await sb.from("admins").select("*");
  if (adminErr) console.error("Admin error:", adminErr);
  else console.log("Admins:", admins);

  const { data: clients, error: clientErr } = await sb.from("clients").select("*");
  if (clientErr) console.error("Client error:", clientErr);
  else console.log("Clients:", clients);
}

run();
