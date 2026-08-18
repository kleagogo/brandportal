# Deploying Pitho

Everything persists through one storage seam (`lib/db.ts`): records in
Postgres whenever `DATABASE_URL` is set, files in Cloudflare R2 whenever the
`R2_*` variables are set. Nothing else in the app knows or cares where it runs,
so the same repo deploys to Cloudflare Workers or to Vercel.

**Cloudflare is the cheaper home** — the Workers free tier permits commercial
use, R2 charges nothing for downloads, and it's one dashboard for hosting,
storage, and DNS.

---

## Option A — Cloudflare Workers (recommended)

### 1. Storage: R2 (~5 min)

1. Cloudflare dashboard → **R2** → *Create bucket*, e.g. `pitho-assets`.
2. Bucket → **Settings** → **Public access**: connect a domain such as
   `assets.yourdomain.com`, or enable the r2.dev URL to start. Copy it.
3. **R2 → Manage API tokens** → *Object Read & Write* for that bucket. The
   Access Key ID and Secret are shown once.

### 2. Database: Neon (~3 min)

Create a free project at [neon.tech](https://neon.tech) and copy the pooled
connection string. On Workers the app talks to it over HTTP (`@neondatabase/serverless`)
rather than holding a TCP pool open — that switch is automatic.

### 3. Deploy (~5 min)

Cloudflare dashboard → **Workers & Pages** → *Create* → **Import a repository**
→ pick this repo, branch `main`, then set:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Both are what Cloudflare pre-fills, so the defaults are correct — `npm run build`
builds the Worker (`next build` alone would leave `wrangler deploy` with nothing
to upload; use `npm run build:next` if you ever want just the Next output).

Name the project **the same as `name` in `wrangler.jsonc`** (`pitho`). If they
differ, the build runs against one Worker and `wrangler deploy` publishes a
second — and any variables you set land on the wrong one.

Add the variables from the table below under **Settings → Variables and
Secrets** (mark the keys as *Secret*), then redeploy.

### 4. Domain

Add your domain to Cloudflare (Websites → Add a domain) and point the
registrar's nameservers at Cloudflare. Then Worker → **Settings → Domains &
Routes** → *Add custom domain*.

### 5. Check it

Open `https://yourdomain.com/api/health`. It writes and reads a row and
reports what's configured:

```json
{ "storage": true, "database": true, "files": "r2",
  "email": { "configured": true, "senderDomain": "yourdomain.com",
             "canReachAnyone": true, "problem": null }, ... }
```

`storage: false` comes with the reason attached.

**`email.canReachAnyone` is the one to read before launch.** A key on its own
proves nothing: with `EMAIL_FROM` unset or on an unverified domain, Resend
accepts mail to the address that owns the Resend account and rejects everyone
else — so you sign in happily while every other person gets "We couldn't send
that email." When `canReachAnyone` is false, `problem` says what to change.

Locally: `npm run cf:preview` runs the real Workers runtime, reading secrets
from a `.dev.vars` file (git-ignored).

---

## Option B — Vercel

1. [vercel.com/new](https://vercel.com/new) → import the repo → Deploy.
2. **Storage** tab → **Neon (Postgres)** → Create; `DATABASE_URL` is injected.
3. Add the variables below under Settings → Environment Variables.
4. Optional: Storage → **Blob** instead of R2 (simpler, but downloads are billed).

Note Vercel's Hobby plan bars commercial use — charging customers means Pro
at $20/month.

---

## Environment variables

| Variable | Required? | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection. Required on Workers — there's no filesystem to fall back to |
| `AUTH_SECRET` | recommended | Session signing. `openssl rand -hex 32`. Without it a secret is generated and stored |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | for real file storage | Cloudflare R2. Without these, files go into Postgres — fine for logos, not for video |
| `R2_PUBLIC_BASE` | with R2 | Public bucket domain, e.g. `https://assets.yourdomain.com`. Serves files off the CDN |
| `RESEND_API_KEY` | **yes in production** | Magic-link email. Without it, sign-in is refused in production — see below |
| `EMAIL_FROM` | with Resend | From address on a verified domain, e.g. `Pitho <hello@yourdomain.com>` |
| `EMAIL_REPLY_TO` | optional | Reply address |
| `ALLOW_DEV_LINKS` | escape hatch | `1` shows sign-in links in the browser when mail isn't configured. Private deployments only |
| `ANTHROPIC_API_KEY` | recommended | Brand Agent chat and AI asset descriptions |
| `BLOB_READ_WRITE_TOKEN` | alternative to R2 | Vercel Blob |
| `UPLOAD_MAX_MB` | optional | Largest single upload, default `500` |

## Email — required before anyone else signs in

A magic link *is* a login, so in production the app refuses to hand one back
to the browser: without a mail provider, sign-in returns "Email isn't
configured on this deployment yet" rather than letting anyone type someone
else's address and be given their link.

1. Create an account at [resend.com](https://resend.com).
2. Add your domain and its DNS records (fast if DNS is already on Cloudflare).
3. Set `RESEND_API_KEY` and `EMAIL_FROM`, then redeploy.

Testing alone? `ALLOW_DEV_LINKS=1` restores the in-browser link. Remove it
before real users arrive.

## Notes

- Files uploaded before R2 was switched on are still read from Postgres —
  nothing needs migrating, and asset URLs never change: they point at
  `/api/files/<name>`, which redirects to the CDN when R2 is on.
- Uploads over the host's request-body limit go straight from the browser to
  R2 on a presigned URL, up to `UPLOAD_MAX_MB`.
- The demo hub (`/demo`) is seeded from `brand.config.ts` and works before
  any database row exists.
