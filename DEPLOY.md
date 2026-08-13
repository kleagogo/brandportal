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
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | **for real file storage** | Cloudflare R2 — see §5. Cheap storage, free downloads |
| `R2_PUBLIC_BASE` | with R2 | Public bucket domain, e.g. `https://assets.yourdomain.com`. Serves files off Cloudflare's CDN |
| `BLOB_READ_WRITE_TOKEN` | alternative to R2 | Set by Vercel Blob. Same idea, but downloads are billed |
| `UPLOAD_MAX_MB` | optional | Largest single upload, default `500` (object storage only) |

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

## 5. File storage (~10 min) — do this before real uploads

Without object storage, files go into Postgres (~0.5GB on Neon's free plan)
and uploads are capped at ~4.5MB by the serverless request limit. Two options;
**Cloudflare R2 is the cheaper one** because downloads are free — no egress
charges, which matters when clients pull assets all day.

### Cloudflare R2 (recommended)

1. Cloudflare dashboard → **R2** → *Create bucket*, e.g. `basel-assets`.
2. Bucket → **Settings** → **Public access**: connect a domain such as
   `assets.yourdomain.com` (or enable the r2.dev URL). Copy it.
3. **R2 → Manage API tokens** → create an *Object Read & Write* token for the
   bucket. The Access Key ID and Secret are shown once.
4. In Vercel set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, and `R2_PUBLIC_BASE` (the domain from step 2). Redeploy.

Assets keep pointing at `/api/files/<name>`, which now redirects to
Cloudflare — so viewers get CDN speed, downloads cost nothing, and switching
storage later doesn't break a single saved link. Files stored before the
switch keep working; nothing needs migrating.

### Vercel Blob (alternative)

Vercel project → **Storage** → **Blob** → Create → redeploy. Simpler, but
downloads are billed.

Either way, files over the request limit upload straight from the browser
with a progress bar, and zips still include them. `UPLOAD_MAX_MB` sets the
per-file ceiling (default 500).

## 6. Custom domain (optional)

Project → Settings → Domains → add e.g. `brandportal.yourdomain.com`.

## Notes

- Without blob storage, uploads live in Postgres (`blobs` table) — fine for
  logos and PDFs; add Blob (§5) before storing video or source files.
- The demo hub (`/meridian`) is seeded from `brand.config.ts` and works
  immediately, before any database rows exist.
