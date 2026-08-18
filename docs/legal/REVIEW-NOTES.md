# Review notes

What the drafts are based on, what they cannot settle, and what to worry about
in what order.

**I am not a lawyer and this is not legal advice.** It is an engineer reading
the code and telling you what the product actually does, so that whoever does
advise you starts from facts instead of a template.

---

## Where every factual claim comes from

| Claim in the drafts | Source |
| --- | --- |
| Account is email, created date, plan, account type. No password | `lib/users.ts`, `User` |
| Sign-in links expire in 1 hour; invite and transfer links in 7 days | `lib/tokens.ts`, `ttl` |
| Session cookie `bp_session`, HTTP-only, 90 days | `app/api/auth/verify/route.ts` |
| Hub PIN and portal unlock cookies, HTTP-only, 30 days | `app/api/hubs/[slug]/pin/route.ts`, `app/api/portals/[id]/unlock/route.ts` |
| Share analytics keep counts, timestamps and file labels, no visitor identity | `lib/analytics.ts` |
| Recent events capped at 40 per link | `lib/analytics.ts`, `RECENT_LIMIT` |
| Deleting a hub deletes its files, meta and portals | `lib/store.ts`, `deleteHub` |
| Deleting an account deletes hubs owned and removes you as editor elsewhere | `app/api/account/route.ts`, `lib/store.ts` |
| Sub-processors: Cloudflare, Neon, Resend, Anthropic | `wrangler.jsonc`, `lib/db.ts`, `lib/email.ts`, `app/api/chat/route.ts` |
| No paid plan is purchasable | `lib/users.ts`, "Pro isn't purchasable yet" |
| Only strictly necessary cookies exist | grep for `cookies().set` across `app/` and `lib/` |

---

## The one that matters most: you are a processor, and you have no DPA

Everything else on this page is tidy-up. This one is structural.

Agencies upload **their clients'** brand material. For that data the agency is
the controller and **Pitho is a data processor**. Under GDPR Article 28 a
processor needs a written data processing agreement with each controller,
covering scope, duration, security, sub-processors, deletion and audit. You do
not have one, and a privacy policy is not a substitute: a policy is a notice
to individuals, a DPA is a contract with your customer.

This bites in three ways:

1. Any agency with a competent operations person will ask for a DPA during
   procurement, and not having one can lose the deal.
2. If a client's unreleased brand leaks, the agency's contract with that client
   almost certainly required a processor agreement to be in place.
3. Your sub-processors must be disclosed and flowed down. You currently send
   hub content to Anthropic and store files on Cloudflare, undisclosed.

**Action:** a standard DPA plus a public sub-processor list. This is the single
highest-value legal item and it is cheap compared with the rest.

---

## Facts only you can supply

The drafts have `[[placeholders]]` because I cannot invent these:

- **Legal entity.** The footer says "© 2026 Pitho" but no company is named
  anywhere on the site. If Pitho is a registered company, the terms need its
  name, number and registered address. If it is you personally trading, that
  needs saying too. Most of the EU requires a trader to identify itself on a
  commercial website, and "Pitho" alone does not do it.
- **Jurisdiction.** The current text says disputes go to "the relevant courts"
  under "applicable law", which is not a choice of law, it is a blank.
- **Where the data sits.** Neon has regions; Cloudflare R2 has locations;
  Anthropic processes in the US. If your customers are in the EU you need to
  say where data goes and on what transfer basis.

---

## Things that are wrong today

**Both documents are dated "Apr 22, 2026"**, which is the template's date, not
a date on which anyone reviewed these terms.

**The privacy policy links to a Cookie Policy that does not exist.** Promising
a document you do not have is worse than not mentioning it. The good news is
you only set strictly necessary cookies, so you do not need a banner at all.

**The terms describe subscriptions, fees, refunds and cancellation.** None of
it is real. Describing billing you do not operate is confusing now, and when
you do start charging, the current wording is missing the consumer withdrawal
right that EU and UK law gives to individuals buying online.

**The privacy policy understates what you hold.** It describes a marketing
site that collects a contact form. It never mentions that you store uploaded
brand assets, which is the entire product and the only genuinely sensitive
thing on the platform.

---

## Product risks worth caring about

These are not paperwork. They are things that could actually hurt a customer.

**A file URL is permanent access.** `/api/files/<name>` serves any file to
anyone holding the URL, with no permission check. The filename carries 12
random bytes, so the link is the capability, the same model as a Dropbox share
link. You accepted this deliberately on 15 August, pre-launch, and the note
you left said to revisit it if the product gained **real clients with
unreleased brands**.

You launched today and you are onboarding real agencies. That condition has
arrived. Nothing is broken, but two consequences are now live rather than
hypothetical:

- A PIN added or changed later does **not** revoke a link already sent.
- Removing an asset from a hub orphans the file rather than deleting it, so
  the old URL keeps working.

Neither is a leak by itself. Both become one the first time a client asks you
to prove that a shared link can be withdrawn. The drafts are written honestly
about this rather than promising revocation you cannot deliver, which is the
right call, but it is worth deciding whether you want to keep promising it.

**PINs and portal passwords are stored in plaintext.** Fine for gating a
preview, not fine if a customer assumes it protects an embargoed campaign, and
not something you want to describe in a security questionnaire.

**The rate limiter is per Worker isolate and in memory.** On Cloudflare that
means the 5-per-15-minutes cap on sign-in emails is far weaker in practice than
it reads, because each isolate counts separately. The abuse case is using your
endpoint to send repeated emails to someone else's address.

---

## Suggested order

1. Apply the naming fix today. It costs minutes and stops the pages naming
   another company. (`minimal-naming-fix.md`)
2. Fill in entity, jurisdiction and data location.
3. Get a DPA and publish a sub-processor list before your first paying agency.
4. Replace the bodies with the grounded drafts, lawyer-checked.
5. Decide what you want to promise about revoking access, then make the
   product match the promise.
