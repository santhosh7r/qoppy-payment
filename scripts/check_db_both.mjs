import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function getEnv(path) {
  const env = {};
  try {
    const txt = readFileSync(path, "utf8");
    for (const line of txt.split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      env[k] = line.slice(i + 1).trim();
    }
  } catch {}
  return env;
}

async function run() {
  const vccEnv = getEnv("/home/santhosh/dev/vcc-timesheet-app/.env");
  const vUrl = vccEnv.VITE_SUPABASE_URL || vccEnv.SUPABASE_URL;
  const vKey = vccEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (vUrl && vKey) {
    const sb = createClient(vUrl, vKey, { auth: { persistSession: false } });
    const { data: users } = await sb.from("users").select("id, name, email, role, password_hash");
    console.log("VCC Users containing gayathri:", users?.filter(u => 
      (u.email && u.email.includes("gaya")) || 
      (u.name && u.name.toLowerCase().includes("gaya"))
    ));
  }
}

run();
