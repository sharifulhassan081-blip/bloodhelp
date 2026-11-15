# Bloodhelp — Sylhet Blood Donor Finder

A mobile-first English/বাংলা Next.js app for finding consenting blood donors and sharing blood requests in Sylhet. Donors, requests, and donation histories are stored in Supabase. There are no fictional donors, requests, statistics, or camps.

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

## No-login device sessions

Visitors do not create an account or enter a password or email to use the site. When someone first submits a donor profile, request, or report, the app automatically creates a Supabase **anonymous session** in the background. Browsing public listings does not create a session. Existing row-level-security policies associate private records with that session; different sessions cannot read or modify each other's records. Email/SMTP is not required.

For a new Supabase project, open **Authentication → Sign In / Providers**, enable **Allow anonymous sign-ins**, and keep **Allow new users to sign up** on: Supabase requires that setting even for background anonymous sessions. No sign-up form is shown to visitors. Email and phone providers can remain disabled. The app requires the normal `authenticated` role for anonymous sessions; the `anon` role without a session has no access to private tables.

A session is stored in the browser, not tied to a recoverable account. **Users must return in the same browser on the same device to manage or delete their submissions.** Clearing browser data, private browsing, a different browser/device, or loss of the session can permanently remove access while records remain stored or public. Anyone using that browser can manage its records. This limitation is stated on both forms, the success screens, the dashboard and the privacy note. Individual records and all records for the current session can be deleted from the dashboard; deletion also removes the anonymous Supabase user. Backups and copies made by others can remain.

## Data, access and retention

- The public donor directory contains only people who explicitly consent, mark themselves available, and pass the app's basic self-reported screen. It exposes their name, phone, blood group, gender, area and emergency preference to **anyone**. Availability and details may be inaccurate. Birth date, weight, health answer and donation history are protected by RLS and accessible to the browser session and site operators.
- Active blood requests (including patient, hospital, contact number and optional note) are publicly readable with explicit consent. A request disappears from the public feed after 24 hours or when marked fulfilled; expiry is enforced in the database view. Expired/fulfilled requests remain stored until deleted. Public details may be copied by others before removal.
- Request links contain only a database ID rather than serialized personal details. The feed and directory are read from Supabase, refresh approximately every 30 seconds while the app is open, and use server-side filters and pagination. There are no automatic donor alerts or push notifications.
- Donors can edit or hide their listing, record a donation, and delete their profile and history. Recording a recent donation switches availability off. Request creators can update received units or delete requests from the same browser. Anyone can submit a concern about a donor; reports are saved privately for the site operator, but do not send a staff alert or guarantee a response.
- The four-calendar-month calculation is an educational screen, not medical clearance. A clinician or blood bank makes the final eligibility decision. The compatibility chart covers red-cell transfusions only.
- Language and dark-mode preferences and the anonymous session may be stored locally. Records from older browser-only versions are **not imported or published**. The PWA caches static assets and an offline fallback; live data is not cached for offline use.

## Tests

```bash
npm test                          # domain rules, mapping and non-PII links
npx playwright install chromium   # once, with OS dependencies if necessary
npm run test:e2e                 # browser flows using an isolated in-memory HTTP double
```

`supabase/tests/rls.sql` exercises real PostgreSQL ownership for anonymous device sessions, public views, expiry, fulfillment, donation-triggered availability, reporting and deletion cascades using generated test users inside a rolled-back transaction. Run it as a database administrator in a controlled environment.

## Operational considerations

Anonymous posting makes abuse easier: arrange CAPTCHA/bot protection, rate limits, active moderation, monitoring and incident response before relying on the site at scale. Supabase's default anonymous-session creation rate limit is not a complete anti-spam system. The operator should also arrange a published privacy policy and contact channel, backup/retention procedures, and clinical review. The application does not verify phone ownership, vet users, automatically moderate submissions, alert staff to reports, or promise emergency response times. Verify emergency contact details with each provider; contact information can change.

- [Sylhet MAG Osmani Medical College, Department of Blood Transfusion](https://magosmanimedical.com/blood-transfusion/) — main number range and extension 645.
- [Bangladesh Red Crescent Society blood centres](https://bdrcs.org/donate-blood/) — Mujib Jahan Red Crescent Blood Centre, Sylhet.
