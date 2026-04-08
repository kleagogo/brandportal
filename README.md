# Brand Portal

A PIN-protected brand asset portal that lives at `yourdomain.com/brand`.

Enter a website URL → Claude reads the brand → a portal preview is generated instantly. Upload your assets, set a PIN, share one link.

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Claude API (Anthropic) — for intelligent brand extraction and asset tagging
- Vercel — hosting

## Getting started

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and add your Claude API key
4. Run locally: `npm run dev`
5. Open http://localhost:3000

## Deploy to Vercel

Push to GitHub, connect the repo in Vercel, add `ANTHROPIC_API_KEY` in Vercel environment variables. Done.

## Claude API key

Get one at https://console.anthropic.com — free credits included on signup.
Without it the app still works using regex-based brand extraction.
