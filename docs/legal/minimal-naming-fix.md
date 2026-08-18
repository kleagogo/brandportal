# Minimal naming fix

The fast path. This removes every trace of the template's identity from the
live legal pages without rewriting the substance. It is strictly better than
what is published now, and strictly worse than the drafts beside this file.

**What it fixes:** the pages stop naming another company, stop describing
another product, and stop pointing at an email address that is not yours.

**What it does not fix:** the clauses still describe an AI content platform
with paid subscriptions. See `REVIEW-NOTES.md` for why that still matters.

Apply in Framer: CMS → Legal → open each item → edit the body field.

---

## Global replacements, both documents

| Find | Replace with |
| --- | --- |
| `Nouva` | `Pitho` |
| `hello@nouva.com` | `hello@pitho.io` |
| `Last Updated: Apr 22, 2026` | `Last updated: 18 August 2026` |

That alone clears 8 occurrences in Terms and 2 in Privacy, plus 4 contact
addresses.

---

## Sentences that need more than a find and replace

These describe the wrong product, so swapping the name leaves them false.

### Terms of Service

**"Use of the Platform" opening.** Currently:

> Nouva is an AI content platform designed for individuals and teams.

Replace with:

> Pitho is a brand hub for agencies. You keep a brand's logos, colours, fonts,
> guidelines and files in one place, and share them with the people who need
> them.

**Prohibited-use bullet.** Currently:

> Use the platform to generate harmful, misleading, or illegal content

Replace with:

> Store or share material that is unlawful, that infringes someone else's
> rights, or that you have no permission to hold

**Intellectual Property, last sentence.** Currently:

> Content you generate using Nouva remains yours — we do not claim ownership
> over your outputs.

Replace with:

> The brand material you upload remains yours. We claim no ownership of it,
> and we do not use it to train any model. Much of it will belong to your
> clients rather than to you, and you confirm you have the right to upload it.

**Subscriptions and Payments.** The whole section describes billing that does
not exist yet. `plan` is typed `'free' | 'pro'` in `lib/users.ts` with the
comment "Pro isn't purchasable yet." Replace the section body with:

> Pitho is currently free to use. If we introduce paid plans we will publish
> the terms before charging anyone.

Then delete the **Cancellation** section, which only describes billing
periods.

### Privacy Policy

**"Who We Are".** Currently:

> Nouva is an AI content platform. For the purposes of data protection law,
> Nouva is the data controller of your personal information.

Replace with:

> Pitho is a brand hub for agencies. For the personal data described here,
> Pitho is the data controller. You can reach us at hello@pitho.io.

**"What Data We Collect".** The first bullet claims a name and company name
that the product never asks for. The account record in `lib/users.ts` is an
email, a created date, a plan and an account type. Replace the bullet:

> Contact information — your name, email address, and company name when you
> submit a form on our website

with:

> Account information: your email address, and the date you signed up. There
> is no password, because signing in works by emailed link.

Then add a bullet, because the biggest category is missing entirely:

> Brand material you upload: logos, images, video, fonts, colour and type
> definitions, guidelines and notes. This can contain personal data if you put
> it there, for example a headshot or a name in an email signature.

**"Cookies".** Currently links to a Cookie Policy that does not exist on the
site. Replace the section with:

> We set three strictly necessary cookies: one to keep you signed in for 90
> days, one to remember a hub PIN for 30 days, and one to remember an unlocked
> share link for 30 days. There are no analytics or advertising cookies, which
> is why there is no cookie banner.

**"Sharing Your Data".** Currently vague about "email and analytics
providers". Name them, because a data subject is entitled to know:

> We do not sell your personal data. We use Cloudflare to host the app and
> store uploaded files, Neon for the database, Resend to send sign-in and
> invitation emails, and Anthropic for the Brand Agent and AI asset
> descriptions.
