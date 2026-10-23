# ShifaAI

ShifaAI turns handwritten prescriptions into clear medication guidance and helps people compare available care options by capacity, specialty, and travel time.

## Existing stack

- Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript
- Supabase Auth and Postgres; server-rendered routes use the existing Supabase SSR client
- English, Urdu, and Sindhi translations with RTL support

## Local setup

Copy `.env.example` to `.env.local` and add your Supabase project URL, anon key, and **server-only** service role key. Add a Gemini key only if you want live prescription OCR.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix. Demo mode exposes judge credentials on the Staff page and should only be enabled in a judge/demo environment.

## Database and demo seed

Run these migrations in the Supabase SQL Editor, in order:

1. `supabase/migrations/20261023_init_bedgrid.sql`
2. `supabase/migrations/20261023_staff_access.sql`

Seed judge accounts and sample cases:

```bash
npm run seed:demo
```

When `DEMO_MODE=true`, `npm run dev` runs that idempotent seed automatically before Next.js starts. Supabase Auth hashes the supplied passwords; ShifaAI never stores or logs plaintext passwords. Demo account cards are served only when demo mode is enabled.

### Judge demo credentials

These accounts are created only when demo mode is enabled and the seed script runs:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@shifaai.app` | `Demo@1234` |
| Coordinator | `coordinator.demo@shifaai.app` | `Demo@1234` |
| Staff | `staff.demo@shifaai.app` | `Demo@1234` |

## Role matrix

| Role | Cases | Staff accounts | Assign cases | Approve users |
| --- | --- | --- | --- | --- |
| Admin | View and manage all | View and change roles | Yes | Yes |
| Coordinator | Dispatch and update all | View staff list | Yes | No |
| Staff | View assigned cases and update status | — | No | No |

Sign-ups request Staff or Coordinator access. In demo mode, accounts are approved as Staff on creation. Otherwise, new accounts remain pending until an Admin changes their role in the Admin dashboard. Case and account APIs verify the authenticated Supabase role on the server; the UI also checks role-specific dashboards.

## Start the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Existing prescription OCR and sample hospital data work as before. Apply the migrations and configure the service role key to enable staff accounts, dashboards, and role management.
