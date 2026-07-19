# Deploying Brand Portal (Vercel + Neon)

The app stores everything through a storage driver: JSON files locally, and
**Postgres automatically whenever `DATABASE_URL` is set** — hubs, users,
sessions, tokens, and uploaded files included. So deployment is just:

## 1. Import the repo on Vercel (~3 min)

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (with GitHub).
2. Import `kleagogo/brandportal`.
3. Under "Git Branch", pick `claude/brand-hub-online-software-5ur9yp`
   (or merge to `main` first and use that).
4. Framework preset: Next.js (auto-detected). Click **Deploy**.

The first deploy will work but won't persist edits yet — that needs the database.

## 2. Add the database (~2 min)

1. In the Vercel project, open the **Storage** tab.
2. Choose **Neon (Postgres)** from the marketplace → **Create** (free tier).
3. Accept the defaults — Vercel injects `DATABASE_URL` into the project
   automatically.
4. Redeploy (Deployments → ⋯ → Redeploy). Done: the app now runs fully on
   Postgres. Tables are created automatically on first use.

## 3. Environment variables (Project → Settings → Environment Variables)

| Variable | Required? | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes (set by Neon) | Postgres connection — activates the DB driver |
| `AUTH_SECRET` | recommended | Session signing. Generate one: `openssl rand -hex 32`. Without it a secret is stored in the DB, which also works |
| `ANTHROPIC_API_KEY` | recommended | Better scans, Brand Agent chat, AI asset descriptions |
| `RESEND_API_KEY` | recommended | Real magic-link emails (free at resend.com). Without it, sign-in links are shown in the UI |
| `EMAIL_FROM` | optional | From address, e.g. `Brand Portal <hello@yourdomain.com>` |

## 4. Custom domain (optional)

Project → Settings → Domains → add e.g. `brandportal.yourdomain.com`.

## Notes

- File uploads live in Postgres (`blobs` table) — fine for logos and PDFs at
  this scale; can move to object storage (R2/S3) later without UI changes.
- The demo hub (`/meridian`) is seeded from `brand.config.ts` and works
  immediately, before any database rows exist.
