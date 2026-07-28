# TBK CRM

A lightweight CRM for TBK Enterprise Consulting, a solo consulting business. Covers the full loop: inbound leads → deals/pipeline → won engagement (project) → invoice, plus a contacts book and basic reporting.

Built with Next.js (App Router, Server Actions), Prisma + SQLite, Tailwind CSS, and NextAuth for single-user login. This replaces an earlier static HTML/React design prototype (`design_handoff_crm/`) with a real persisted app.

## Screens

- **Dashboard** — pipeline stats, recent leads, top open deals
- **Leads** — inbound inquiries, CSV import, "sync now" (stand-in for a Google Sheet/webhook feed), convert to deal
- **Deals** — drag-and-drop kanban pipeline, deal drawer with activity log and follow-up tasks
- **Projects** — delivery work for won engagements, subtask checklists with auto-computed progress
- **Contacts** — contact book with an activity/notes log
- **Invoices** — amounts owed, status tracking, optional link to a won deal
- **Reports** — lead source performance, monthly revenue from won deals

## Getting started

```bash
npm install
cp .env.example .env   # then edit AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate     # creates the SQLite database
npm run db:seed        # seeds sample data + the admin user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` (defaults: `admin@tbkconsulting.com` / `changeme123`).

## Environment variables

See `.env.example`:

- `DATABASE_URL` — SQLite file path (default `file:./dev.db`)
- `AUTH_SECRET` — random secret for NextAuth session signing (`openssl rand -base64 32`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the single seeded user account

## Database

Data is stored in SQLite via Prisma, which keeps local setup to zero external services. To move to a hosted Postgres database (e.g. Supabase or Neon) later:

1. Update the `datasource` provider in `prisma/schema.prisma` to `postgresql`.
2. Swap the driver adapter in `lib/prisma.ts` and `prisma/seed.ts` from `@prisma/adapter-better-sqlite3` to `@prisma/adapter-pg`.
3. Point `DATABASE_URL` at the Postgres connection string.
4. Run `npm run db:migrate` against the new database.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and start
- `npm run lint` — ESLint
- `npm run db:migrate` — run Prisma migrations
- `npm run db:seed` — seed sample data + admin user (safe to re-run; skips if leads already exist)

## Notes on scope

- Auth is a single hardcoded admin account (no signup flow), matching the solo-user context.
- "Sync now" on the Leads page drains a small seeded queue of pending inbound leads as a stand-in for a real Google Sheets/webhook integration — see the original design handoff (`design_handoff_crm/README.md`) for the intended real integration.
- CSV import is a naive comma-split per line, no header-row detection, matching the original design intent — a production version should add quoted-field parsing and duplicate detection.
