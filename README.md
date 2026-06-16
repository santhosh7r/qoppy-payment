# Qoppy-style Codebase Delivery Platform

A Next.js + Supabase platform where a signed-in client recharges credits, spends
them to request access, and — once access is live — browses the full codebase in
a syntax-highlighted viewer.

> **No real payment.** There is no payment processor and **no card / CVV / OTP
> collection anywhere**. "Recharge" is a simulated credit top-up.

## Client flow
1. **Sign in** at `/login` (accounts are provisioned — there is no signup).
2. **Recharge credits** in the dashboard.
3. **Get access** — spends credits and moves to *processing*.
4. Access goes live → the **codebase unlocks** in the dashboard.

> The approval that flips *processing → granted* happens in a backend console
> (`/admin`). It is intentionally **not linked** from any client-facing page —
> the client only ever sees "access processing".

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind (dark + lime theme)
- Supabase (Postgres) for clients, credits, and access status
- Custom email+password auth (scrypt hash, signed httpOnly cookie)

## Setup
1. `npm install`
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
3. `cp .env.local.example .env` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (backend console at `/admin`)
4. Provision a client login:
   ```bash
   node scripts/create-client.mjs client@example.com 'their-password' 0
   ```
5. `npm run dev`

## Backend console (`/admin`)
Lists clients with their credits and access status. Clients in **processing**
have spent credits and await approval — click **Grant access** to unlock their
codebase (or **Revoke** to lock it again).

## Customizing
- Branding, price (credits), recharge packs: [`lib/brand.ts`](lib/brand.ts)
- Delivered codebase: read at runtime from `vcc-timesheet-app/` by
  [`lib/codebase.ts`](lib/codebase.ts) (override with `CODEBASE_DIR`). Skips
  `node_modules`, `.git`, `dist`, binaries, and **all `.env` / lockfiles**.

## Notes
- `/admin` uses a single shared password — fine for a demo. Use a real auth/role
  check for production.
- Row Level Security is on; all access goes through the server with the
  service-role key.
# qoppy-payment
