import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword, signAdmin, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

type AdminRow = { id: string; email: string; password_hash: string };

// Admin credentials live in the Supabase `admins` table (not in env).
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const { data } = await supabaseAdmin()
    .from("admins")
    .select("*")
    .eq("email", String(email).toLowerCase().trim())
    .single();

  const admin = data as AdminRow | null;
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, signAdmin(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
