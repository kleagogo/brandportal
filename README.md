# Brand Portal

A living brand hub: scan any website, get a fully-populated brand hub in
30 seconds, edit it in place, and share one link. Built for startups keeping
their brand in one place and agencies handing brands off to clients.

## How it works

1. **Scan** — paste a URL on the landing page. The scanner reads the site's
   logo, colors, typography, and voice, and builds a complete hub preview.
2. **Claim** — enter your email, click the magic link, and the preview becomes
   your hub at its own address (`/your-brand`). No passwords anywhere.
3. **Edit in place** — the hub is the editor. Click a swatch to change it,
   drag files onto a section to upload, toggle font weights. Autosaves.
4. **Share** — send the link. Optional 4-digit PIN for viewers, and editor
   invites by email for teammates.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the landing page — or `/meridian`, the demo hub
(a fictional travel-gear brand; anyone can edit the demo).

## Environment variables (all optional)

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Sharpens website scans with Claude and powers the Brand Agent chat |
| `RESEND_API_KEY` | Sends real magic-link emails via Resend. Without it, sign-in/invite links are shown directly in the UI (dev mode) |
| `EMAIL_FROM` | From address for outgoing email |
| `AUTH_SECRET` | Session-signing secret. Auto-generated into `/data` if unset |

## Architecture notes

- **Storage** is file-based under `/data` (hubs, previews, users, tokens,
  uploads) behind small interfaces in `lib/` — designed to swap for Postgres +
  object storage without touching UI code. This means edits persist locally
  but NOT on serverless hosts yet; the database adapter is the next milestone.
- **Auth** is passwordless: magic links, signed session cookies, single-use
  tokens. Editor permissions are per-hub email lists.
- **Routes**: `/` landing · `/preview/[id]` scan previews (24h) · `/[slug]`
  hubs · `/dashboard` your hubs · `/login` sign in.
