# Bloodhelp — Sylhet Blood Donor Finder

A mobile-first English/বাংলা Next.js app for finding consenting blood donors and sharing blood requests in Sylhet. Donors, requests, and donation histories are stored in Supabase, not in browser-local demo data. New installations start with an empty directory and feed; no donors, requests, statistics, or camps are invented.

**Emergency:** The site does not automatically notify donors, hospitals or emergency services. Contact the hospital directly or call Bangladesh's national emergency number **999**. Users submit their own details; phone numbers and requests are not independently verified. A blood bank or clinician must assess donor eligibility, blood type and crossmatching.

## Run locally

Requires Node.js 20.9 or later and a Supabase project with the migrations in `supabase/migrations` applied. Copy `.env.example` to `.env.local` and fill in your project's URL and **publishable** key. Do not put a Supabase secret or service-role key in a browser environment variable.

```bash
npm ci
cp .env.example .env.local
# edit .env.local
npm run dev
# Open http://localhost:3000
```

Run `npm run build` and `npm start` for the production build. The Supabase migrations in this repository have the same versions as the project's applied migration history; apply them in order to a fresh project.

## Email setup — required for public sign-ups

Email confirmation is enabled. Supabase's built-in email sender is intended for testing, is heavily rate-limited and sends only to addresses on the project team. **The project owner must configure a custom SMTP provider under Supabase → Authentication → SMTP Settings** before members of the public can reliably receive confirmation or password-reset emails. Do not disable email confirmation to work around this. Configure a sender domain and the production site/redirect URLs in Supabase Auth, then test confirmation and recovery using a real external address.

The deployed app currently sets `NEXT_PUBLIC_EMAIL_SETUP_PENDING=true` to warn visitors. After SMTP has been configured and tested, change that Vercel environment variable to `false` and redeploy; it is baked into the frontend at build time. Public account creation cannot be considered fully operational until email delivery is verified. Phone authentication/SMS verification is not configured.

## Data, access and retention

- A confirmed email account is required to create or manage records. The public donor directory contains only people who explicitly consent, mark themselves available, and pass the app's basic self-reported screen. It exposes their name, phone, blood group, gender, area and emergency preference to **anyone**. Availability and details may be inaccurate. The birth date, weight, health answer and donation history are in owner-only tables protected by row-level security (RLS).
- Active blood requests (including patient, hospital, contact number and optional note) are publicly readable with explicit consent. A request disappears from the public feed after 24 hours or when marked fulfilled; expiry is enforced in the database view. Expired/fulfilled requests remain in the owner's account until deleted. Public details may be copied by others before removal.
- Request links contain only a database ID rather than serialized personal details. The feed and directory are read from Supabase, refresh approximately every 30 seconds while the app is open, and use server-side filters and pagination. There are no automatic donor alerts or push notifications.
- Donors can edit or hide their listing, record a donation, and delete their profile and history. Recording a recent donation switches availability off. Request owners can update received units or delete their requests. Signed-in users can submit a concern about a donor; the report is saved privately for the site operator, but does not send a staff alert or guarantee a response. Account deletion removes the auth user and cascades their stored profile, history, requests and reports. Supabase backups and copies made by others may persist according to their own retention practices.
- The four-calendar-month calculation is an educational screen, not medical clearance. A clinician or blood bank makes the final eligibility decision. The compatibility chart covers red-cell transfusions only.
- Language and dark-mode preferences may be stored locally. Records from older browser-only versions are **not imported or published**. The PWA caches static assets and an offline fallback; live data is not cached for offline use.

## Tests

```bash
npm test                          # domain rules, mapping and non-PII links
npx playwright install chromium   # once, with OS dependencies if necessary
npm run test:e2e                 # browser flows using an isolated in-memory HTTP double
```

`supabase/tests/rls.sql` exercises real PostgreSQL ownership, public views, expiry, fulfillment, donation-triggered availability, and account-deletion cascades using generated test users inside a rolled-back transaction. Run it as a database administrator in a controlled environment; it is not a substitute for testing actual email delivery and a real browser sign-up.

## Operational considerations

Before relying on the site at scale, the operator should arrange a published privacy policy and contact channel, an active moderation process, anti-spam and rate limiting, monitoring and incident response, backup/retention procedures, and clinical review. The application does not verify phone ownership, vet users, automatically moderate submissions, alert staff to reports, or promise emergency response times. Verify emergency contact details with each provider; contact information can change.

- [Sylhet MAG Osmani Medical College, Department of Blood Transfusion](https://magosmanimedical.com/blood-transfusion/) — main number range and extension 645.
- [Bangladesh Red Crescent Society blood centres](https://bdrcs.org/donate-blood/) — Mujib Jahan Red Crescent Blood Centre, Sylhet.
