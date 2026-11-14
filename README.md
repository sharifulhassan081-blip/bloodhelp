# Bloodhelp — Sylhet Blood Donor Finder

A mobile-first, bilingual (English/বাংলা) Next.js demonstration for finding blood donors and coordinating blood requests in Sylhet. It includes a donor directory, local request sharing, a donor dashboard, compatibility information, emergency contacts, a Sylhet map, camp examples, dark mode and an installable PWA shell.

> **Important: this is a demonstration, not a functioning emergency service.** The 36 donor profiles, example requests, camp listings, distances, and community statistics are fictional/illustrative. Calls and messages to sample donors are disabled. In a real emergency, contact a hospital directly or call Bangladesh's national emergency number **999**.

## Run locally

Requires Node.js 20.9 or later.

```bash
npm ci
npm run dev
# Open http://localhost:3000
```

`npm run build` builds the production application. `npm start` serves the production build.

## Tests

```bash
npm test                           # domain logic and compatibility checks
npx playwright install chromium   # once, including OS dependencies if needed
npm run test:e2e                   # browser flows
```

## How the demo works

- There is **no database, authentication server, real OTP, notification service, or shared live feed**. Profiles, donation history, request records, demo reports, preferences and camp RSVPs are stored in the current browser's `localStorage`. Other visitors cannot see these records, and clearing site data deletes them. Changes sync between tabs of the same browser only.
- Requests expire 24 hours after creation. A request link serializes the request details in its URL so that someone on another device can view it without a backend. **The link contains the patient's name, hospital, phone number, note and other request details; anyone with the link can read them.** Users must explicitly acknowledge this before creating a request. Sharing opens WhatsApp or Facebook; it does not notify donors automatically.
- Donor phone verification is a clearly labeled simulation using `123456`; no SMS is sent and it does not verify ownership. Reports and camp RSVPs are local examples, not submissions to an administrator or organizer.
- A donor ID QR code contains only the locally generated ID, not personal details or a server-backed profile. Donor badges are based on the number of locally recorded donations.
- The four-calendar-month calculation and red-cell compatibility chart are educational aids, not medical clearance. A blood bank/clinician must assess a donor's eligibility and perform blood typing and crossmatching.
- The service worker caches visited pages and static assets for an offline fallback. The browser's install prompt is used when available; otherwise the app explains how to add it to the home screen.

## Real-world launch requirements

Before anyone relies on this for emergencies, replace the mock/local data layer with a secure shared backend (for example Supabase or Firebase) with `donors`, `blood_requests`, and `donations_history` records. Implement proper authentication and real phone verification, verified-seeker authorization and consent, access controls/row-level security, encryption and retention/deletion policies, abuse reporting and moderation, server-side validation, real-time availability and request updates, background expiry, secure non-PII share tokens, notification delivery, accurate locations, and an operational privacy policy. Independently verify all emergency contacts and obtain clinical review of eligibility guidance. Do not publish example statistics or simulated badges as real.

## Emergency contact sources

- [Sylhet MAG Osmani Medical College, Department of Blood Transfusion](https://magosmanimedical.com/blood-transfusion/) — main number range and extension 645.
- [Bangladesh Red Crescent Society blood centres](https://bdrcs.org/donate-blood/) — Mujib Jahan Red Crescent Blood Centre, Sylhet.

Contact information can change; confirm details with the providers.
