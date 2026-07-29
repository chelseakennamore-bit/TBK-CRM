# TBK CRM

A lightweight CRM for TBK Enterprise Consulting, a solo consulting business. Covers the full loop: inbound leads → deals/pipeline → won engagement (project) → invoice, plus a contacts book and basic reporting.

Built with Next.js (App Router, Server Actions), Prisma + Postgres, Tailwind CSS, and NextAuth for single-user login. This replaces an earlier static HTML/React design prototype (`design_handoff_crm/`) with a real persisted app.

## Screens

- **Dashboard** — pipeline stats, recent leads, top open deals
- **Leads** — inbound inquiries synced from a Google Sheet, CSV import, convert to deal
- **Deals** — drag-and-drop kanban pipeline, deal drawer with activity log and follow-up tasks
- **Projects** — delivery work for won engagements, subtask checklists with auto-computed progress
- **Contacts** — contact book with an activity/notes log
- **Invoices** — amounts owed, status tracking, optional link to a won deal
- **Reports** — lead source performance, monthly revenue from won deals

## Getting started (local development)

You need a Postgres database. The quickest options are a free [Neon](https://neon.tech) project (see `DEPLOY.md`) or a local Postgres install.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate     # applies the schema to your database
npm run db:seed        # seeds sample data + the admin user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` (defaults: `admin@tbkconsulting.com` / `changeme123`).

## Deploying

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step instructions to deploy this app to Vercel with a free Neon Postgres database.

## Google Sheets lead sync

See **[SHEETS-SETUP.md](./SHEETS-SETUP.md)** for how to connect the Leads page's "Sync now" button to your real lead-capture spreadsheet.

## Environment variables

See `.env.example`:

- `DATABASE_URL` — Postgres connection string
- `AUTH_SECRET` — random secret for NextAuth session signing (`openssl rand -base64 32`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the single seeded user account
- `GOOGLE_SHEETS_SPREADSHEET_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — see `SHEETS-SETUP.md`

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — applies pending Prisma migrations (`prisma migrate deploy`) then builds for production; this is also what runs automatically on every Vercel deploy
- `npm run start` — start the production server (after `build`)
- `npm run lint` — ESLint
- `npm run db:migrate` — create and apply a new Prisma migration during local development
- `npm run db:seed` — seed sample data + admin user (safe to re-run; skips sample data if leads already exist, but always upserts the admin user)

## Notes on scope

- Auth is a single hardcoded admin account (no signup flow), matching the solo-user context.
- "Sync now" pulls from the "Leads" and "Contact" tabs of the real Google Sheet (see `SHEETS-SETUP.md`); it's manual/on-demand rather than scheduled.
- There's no way to delete a lead from the UI yet — sheet rows that aren't real inquiries (test data, notification noise, etc.) will still get imported.
- CSV import is a naive comma-split per line, no header-row detection, matching the original design intent — a production version should add quoted-field parsing and duplicate detection.
