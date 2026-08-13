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
| `RESEND_API_KEY` | **yes in production** | Real magic-link emails (free at resend.com). See §4 — without it, sign-in is disabled in production |
| `EMAIL_FROM` | with Resend | From address on a verified domain, e.g. `Basel <hello@yourdomain.com>` |
| `EMAIL_REPLY_TO` | optional | Reply address for magic-link emails |
| `ALLOW_DEV_LINKS` | escape hatch | `1` brings back showing sign-in links in the browser when mail isn't set up. Only for a private deployment — see §4 |
| `BLOB_READ_WRITE_TOKEN` | for big files | Set by Vercel Blob. Lets the browser upload straight to storage, past the ~4.5MB request limit |
| `UPLOAD_MAX_MB` | optional | Largest single upload, default `500` (blob storage only) |

## 4. Email (~5 min) — required before anyone else signs in

A magic link *is* a login. So in production the app refuses to hand one back
to the browser: without a mail provider, sign-in returns "Email isn't
configured on this deployment yet" rather than letting anyone type someone
else's address and be given their link.

1. Create an account at [resend.com](https://resend.com) (free tier is plenty).
2. Add your domain and its DNS records, or use their test sender to start.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel → redeploy.

Testing alone and don't want to set this up yet? Set `ALLOW_DEV_LINKS=1` and
the link comes back in the browser as it does locally. Remove it before real
users arrive.

## 5. Large files (~2 min) — optional

Uploads normally pass through the app, and serverless request bodies cap out
around 4.5MB. To store video, packaged design files, and big PDFs:

1. Vercel project → **Storage** → **Blob** → Create.
2. Vercel injects `BLOB_READ_WRITE_TOKEN`. Redeploy.

The uploader then sends anything over 4MB from the browser straight to blob
storage (multipart, with a progress bar), and zips still include those files.
Raise or lower the ceiling with `UPLOAD_MAX_MB`.

## 6. Custom domain (optional)

Project → Settings → Domains → add e.g. `brandportal.yourdomain.com`.

## Notes

- Without blob storage, uploads live in Postgres (`blobs` table) — fine for
  logos and PDFs; add Blob (§5) before storing video or source files.
- The demo hub (`/meridian`) is seeded from `brand.config.ts` and works
  immediately, before any database rows exist.
