# ShifaAI

ShifaAI turns handwritten prescriptions into clear medication guidance and helps people compare available care options by capacity, specialty, and travel time.

## What is working

- Prescription image upload through `POST /api/ocr` using Gemini 2.5 Flash.
- Safe prescription fallback when Gemini is not configured or unavailable.
- Hospital data loaded from Supabase through `GET /api/hospitals`, with local sample data as a development fallback.
- Supabase Realtime listener for hospital capacity changes.
- Coordinator-only referral holds through `POST /api/referral-holds`.
- Light/dark mode and English, Urdu, and Sindhi support.

## Local setup

Copy `.env.example` to `.env.local` if it does not already exist, then fill in only these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`GEMINI_API_KEY` is server-only. Never rename it to `NEXT_PUBLIC_GEMINI_API_KEY` and never commit `.env.local`.

No WhatsApp token, WhatsApp database, Google Maps key, or service-role key is required for the current app.

## Supabase activation

1. Open the Supabase SQL Editor for your project.
2. Run `supabase/migrations/20261023_init_bedgrid.sql`.
3. Insert or import hospital records into the `hospitals` table. Until then, the app transparently uses its local sample records.
4. For anyone allowed to create a bed hold, create an Auth user and set this protected app metadata in the Supabase dashboard or admin workflow:

```json
{ "role": "coordinator" }
```

The role must be in `app_metadata`, not `user_metadata`. The public browser never receives a service-role key.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
npm run build
npm run lint
```
