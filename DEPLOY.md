# Deploying TBK CRM (Vercel + Neon)

This gets you a live URL with a real, persistent Postgres database. Takes about 10 minutes.

## 1. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier is plenty for this app).
2. Create a new project — any name/region is fine.
3. On the project dashboard, find the **Connection string**. Neon shows both a "Pooled connection" and a "Direct connection" — copy the **direct connection** string (not the pooled one). It looks like:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   (Direct connection keeps things simple for a solo-user app. If you ever need to scale to many concurrent users, switch to the pooled connection string plus a separate `DIRECT_URL` for migrations — ask your developer/AI assistant to wire that up when the time comes.)

## 2. Push this code to GitHub

If you're reading this from a Claude Code session, the code is already pushed to a branch on your repo. Merge that branch to `main` (or whichever branch you want Vercel to deploy from) — either via a pull request or by asking Claude to open one.

## 3. Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
2. Click **Add New → Project**, and select this GitHub repo.
3. Vercel auto-detects Next.js — leave the build settings as default (it will run `npm run build`, which applies Prisma migrations automatically before building).
4. Before clicking Deploy, add these **Environment Variables**:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon direct connection string from step 1 |
   | `AUTH_SECRET` | a random secret — generate one with `openssl rand -base64 32` |
   | `ADMIN_EMAIL` | the email you'll log in with |
   | `ADMIN_PASSWORD` | the password you'll log in with (change this from the sample default) |

5. Click **Deploy**. Vercel will install dependencies, run `prisma migrate deploy` (creates all the tables in your Neon database), and build the app.

## 4. Seed the database once

The build step creates the tables but doesn't add your admin login or sample data — that's a separate one-time step. From your local machine, with this repo checked out:

```bash
npm install
DATABASE_URL="<paste your Neon direct connection string>" \
ADMIN_EMAIL="<same email as in Vercel>" \
ADMIN_PASSWORD="<same password as in Vercel>" \
npm run db:seed
```

This creates your admin user (and some sample leads/deals/contacts to explore — safe to delete later). Re-running it is safe: it skips the sample data if leads already exist, but always keeps your admin credentials in sync with whatever `ADMIN_EMAIL`/`ADMIN_PASSWORD` you pass.

## 5. Log in

Visit the URL Vercel gives you (e.g. `https://tbk-crm.vercel.app`) and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Future deploys

Every push to the branch Vercel is watching triggers a new deploy, which automatically runs any new Prisma migrations against your Neon database before building — no manual migration step needed after the first setup.

## Custom domain

Once you're happy with the app, you can add a custom domain (e.g. `crm.yourdomain.com`) from the Vercel project's **Settings → Domains** tab.
