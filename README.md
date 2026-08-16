# Brand Portal

A living brand hub: one clean home per client for every logo, color, font and
file — editable in place and shareable as a single link. Built for agencies
handing brands off to clients, and for startups keeping their brand in one
place.

## How it works

1. **Sign in** — enter your email and click the magic link. No passwords
   anywhere; the same link creates your account.
2. **Create a client space** — each one is a hub at its own address
   (`/your-brand`), starting from a blank brand structure.
3. **Fill it in place** — the hub is the editor. Click a swatch to change it,
   drag files onto a section to upload (they're auto-named and tagged on
   arrival), toggle font weights. Autosaves.
4. **Share** — send the link. Optional 4-digit PIN for viewers, editor invites
   by email for teammates, and share portals (`/s/<id>`) for scoped,
   white-labelled client views.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the landing page — or `/demo`, the demo hub
(a fictional travel-gear brand; anyone can edit the demo).

## Environment variables (all optional)

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Names and tags uploaded assets, and powers the Brand Agent chat |
| `RESEND_API_KEY` | Sends real magic-link emails via Resend. Without it, sign-in/invite links are shown directly in the UI (dev mode) |
| `EMAIL_FROM` | From address for outgoing email |
| `AUTH_SECRET` | Session-signing secret. Auto-generated into `/data` if unset |

## Architecture notes

- **Storage** goes through a driver (`lib/db.ts`): JSON files under `/data`
  in development, **Postgres automatically when `DATABASE_URL` is set** —
  including uploaded files. Deployable to Vercel + Neon as-is: see DEPLOY.md.
- **Auth** is passwordless: magic links, signed session cookies, single-use
  tokens. Editor permissions are per-hub email lists.
- **Routes**: `/` landing · `/[slug]` hubs · `/s/[id]` share portals ·
  `/dashboard` your hubs · `/login` sign in.
