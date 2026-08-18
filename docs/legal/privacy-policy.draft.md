# Privacy Policy (DRAFT)

> **DRAFT, NOT YET LAW-CHECKED.** Written by reading what the code actually
> does, not from a template. Every factual claim below is traceable to a file
> in this repo, listed in `REVIEW-NOTES.md`. It still needs a lawyer's eye
> before it goes live, because Pitho holds other companies' brand assets and
> that raises processor questions this draft flags but cannot settle.

**Last updated: 18 August 2026**

## Who we are

Pitho is a brand hub for agencies. Agencies use it to keep a client's logos,
colours, fonts, guidelines and files in one place, and to share them through a
link.

For the personal data described below, Pitho is the data controller. You can
reach us at hello@pitho.io.

## What we collect

**Your account.** An email address, the date you signed up, your plan, and
your account type. That is the whole account record. There is no password,
because signing in works by emailed link, and we never ask for a name, a
company, or a phone number.

**What you put in a hub.** The brand material you upload: logos, images,
video, fonts, colour and type definitions, written guidelines, and any notes
you add. This is content rather than personal data, but it can contain
personal data if you put it there, for example a headshot or a name in an
email signature template.

**Share link activity.** When someone opens a share link we count the view,
count downloads, record the time, and keep the name of the file taken. We keep
the most recent forty of these events per link. We do not record who the
visitor was: no name, no email, no IP address, no cookie that identifies them
across sites.

**Messages you send us.** Anything you write to us at hello@pitho.io.

We do not collect analytics about how you browse the app, and we do not run
advertising or tracking pixels.

## Cookies

We set three cookies, all strictly necessary, all HTTP-only:

| Cookie | Purpose | Life |
| --- | --- | --- |
| `bp_session` | Keeps you signed in | 90 days |
| Hub PIN cookie | Remembers that you entered a hub's PIN | 30 days |
| Portal unlock cookie | Remembers that you unlocked a share link | 30 days |

There are no analytics, advertising, or third-party cookies, which is why you
do not see a cookie banner.

## How we use it

- To sign you in and keep you signed in.
- To store and serve the hubs you create, and the files in them.
- To send the emails the product depends on: sign-in links, invitations to
  edit a hub, and ownership transfers.
- To show you how a share link has been used.
- To answer you when you get in touch.

We do not sell personal data, and we do not use your brand material to train
any model.

## Legal basis

- **Contract.** Running your account and your hubs is what you signed up for.
- **Legitimate interests.** Keeping the service secure, limiting abuse of the
  sign-in endpoint, and answering your questions.
- **Legal obligation.** Where the law requires us to keep or produce records.

## Who we share it with

We use a small number of providers, each doing one job:

| Provider | What it handles | Where |
| --- | --- | --- |
| Cloudflare | Hosting the app, and storing uploaded files in R2 | Global edge |
| Neon | The Postgres database holding accounts and hub records | See Neon's regions |
| Resend | Sending sign-in, invite and transfer emails | See Resend's terms |
| Anthropic | The Brand Agent, and AI descriptions of assets | See Anthropic's terms |

Anthropic receives the message you type to the Brand Agent, together with the
brand information from the hub you are in, so it can answer. It does not
receive your email address.

## How long we keep it

- **Sign-in links** expire after one hour. **Invite and ownership-transfer
  links** expire after seven days. Expired links are cleared out.
- **Your account and hubs** are kept until you delete them.
- **Share link activity** is capped at the forty most recent events per link
  and is deleted with the link.

## Deleting things

Deleting a hub deletes its record, its share links and their activity, and the
files uploaded to it. Deleting your account deletes every hub you own, by the
same route, and removes you as an editor from anyone else's hub.

Deletion is immediate in the application. Backups and provider-side copies may
persist for a short period afterwards.

## Your rights

You can ask us to give you a copy of your data, correct it, or delete it, and
you can complain to your data protection authority. Deleting your account from
the settings page does most of this immediately. For anything else, write to
hello@pitho.io.

## Changes

We will post changes on this page and update the date above.

## Contact

hello@pitho.io
