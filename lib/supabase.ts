import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side admin client. Uses the service-role key — NEVER expose this to the browser.
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env not set. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local"
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return cached;
}

export type AccessStatus = "locked" | "processing" | "granted";

export type Client = {
  id: string;
  email: string;
  password_hash: string;
  credits: number;
  access_status: AccessStatus;
  created_at: string;
};
