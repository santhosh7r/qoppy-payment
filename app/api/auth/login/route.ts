import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Client } from "@/lib/supabase";
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

// Login only — there is no signup. Accounts are provisioned in the backend.
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const { data } = await supabaseAdmin()
      .from("clients")
      .select("*")
      .eq("email", String(email).toLowerCase().trim())
      .single();

    const client = data as Client | null;
    if (!client || !verifyPassword(password, client.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, signSession(client.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Login failed" }, { status: 500 });
  }
}
