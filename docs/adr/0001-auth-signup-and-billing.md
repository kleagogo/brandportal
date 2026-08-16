# ADR-0001: Authentication, signup, and billing

**Status:** Accepted — partially amended 2026-08-15 (see Amendment)
**Date:** 2026-08-15
**Deciders:** Klea Gogo

## Amendment — 2026-08-15: the scan funnel is gone

The website scanner and the scan → preview → claim path have been removed from
the product, and their code deleted (`lib/scanner.ts`, `/api/scan`,
`/api/claim`, `/preview/[id]`, and the `'claim'` token purpose). A new client
space now starts blank and is filled by uploading the files the agency already
has.

**What this changes below:** the Context's "acquisition path worth protecting"
and D3's supporting argument ("it inverts the strongest asset: scan → preview →
claim shows someone their own brand before asking for anything") describe a
flow that no longer exists. Both are kept as written, as the record of what was
reasoned at the time.

**What still holds:** D3's *decision* — signup before pricing, free account
first, upgrade at the limit — does not depend on the scanner. It rests on a
subscription needing a user record to attach to, which is unchanged. But it has
lost the argument that made it strong, so the funnel now has to earn conversion
on first-run experience rather than on pre-account value. Revisit D3 alongside
the free tier's limits (action item 3), not separately.

D1, D2 and D4 are untouched.

## Context

Pitho sells to design agencies who keep a brand hub per client. Sign-in is
already built and passwordless: a magic link sets a signed session cookie that
lasts 90 days (`SESSION_TTL_MS`, `lib/auth.ts`). `ensureUser(email)` is
find-or-create by address, so an account exists the moment someone proves they
can read an inbox — not when they type it.

Billing does not exist. `User.plan` (`'free' | 'pro'`) is declared and
`limitsFor()` already reads it (`lib/limits.ts`), so limits are plan-aware
today; there is simply no code that ever changes the value. Free allows 25
client spaces with 25 editors each.

Ownership is flat: a hub has one `ownerId` and an `editors[]` list of email
addresses (`lib/store.ts`). `transferOwnership()` exists for succession.

There is also an acquisition path worth protecting: a visitor scans their
website, sees a populated preview hub, and claims it with a magic link. Value
lands before any account does.

Four questions were open. This record settles them so they aren't reopened
without new information.

## Decision

1. **Stay passwordless.** No password authentication.
2. **Defer Google sign-in** until signup friction is measured, not assumed.
3. **Signup comes before pricing.** Free account first, upgrade at the limit.
4. **Bill per user.** No organisation layer until a customer asks for one.

## Options considered

### D1 — Passwords

| Option | Complexity | Ongoing cost | Risk |
| --- | --- | --- | --- |
| **A. Magic links only** *(chosen)* | None — already built | Email deliverability | Inbox is the single factor |
| B. Add passwords | High | Reset flows, support | Hashing, breach liability |

The argument for passwords is usually convenience, and it does not survive
contact with the numbers. Re-authentication frequency is governed by session
length, not by auth method: at 90 days, a user signs in roughly four times a
year per device either way. Passwords would not reduce that — they would only
change what you type when it expires, while adding hashing, reset flows (which
are magic links wearing a hat), breach liability, and a support burden.

**Accepted costs:** a new device needs an inbox round-trip; sign-in now depends
on Resend staying up and within quota (100/day on the free tier); a user who
loses access to their email loses access to Pitho.

### D2 — Google sign-in

| Option | Effort | Benefit | When |
| --- | --- | --- | --- |
| **A. Defer** *(chosen)* | None | — | Revisit if signup drop-off shows |
| B. Add now | OAuth client + callback route | Removes one inbox round-trip | — |

Deferring costs nothing later. `ensureUser(email)` already resolves by address,
so a Google callback can call the same function and land on the same account —
one account, two doors, no migration. Building it now would solve a friction
problem nobody has measured.

**Precondition when built:** only trust Google's address when `email_verified`
is true, or a user can claim an inbox that isn't theirs.

### D3 — Where pricing sits

| Option | Conversion | Implementation |
| --- | --- | --- |
| **A. Signup, then upgrade** *(chosen)* | Value precedes payment | Plan changes on an existing user |
| B. Choose a tier first | Filters to buyers only | Still needs an account to bill |

A subscription must attach to a user record, so an account is required either
way — tier-first only moves the wall earlier. It also inverts the strongest
asset: scan → preview → claim shows someone their own brand before asking for
anything. A paywall in front of that discards the reason it works.

**Accepted cost:** free accounts will outnumber paying ones, and 25 client
spaces is generous enough that few users will hit the ceiling that triggers an
upgrade. Revisit the free tier's shape before charging, not the funnel order.

### D4 — Who the customer is

| Option | Fits today | Migration cost later |
| --- | --- | --- |
| **A. Per-user billing** *(chosen)* | Matches `ownerId` + `editors[]` | Moderate — everything routes through `ownerId` |
| B. Organisation layer now | Correct for agency teams | Paid up front, before demand |

The buyer is an agency, which argues for an org that holds the plan. But the
current model already covers most of the need: the lead owns the hubs, editors
collaborate free, and `transferOwnership()` handles someone leaving. Because
every permission check already routes through `ownerId`, an org layer can be
introduced later without rewriting call sites.

**Accepted cost:** one agency means one payer. There is no shared seat pool, no
per-seat pricing, and no way for a colleague to pay the bill. Ownership
transfer is the only succession path.

## Trade-off analysis

The through-line is deferral where deferral is cheap. D2 and D4 are both
"don't build it yet", and both are safe specifically because the existing code
shape — resolve-by-email, route-through-`ownerId`— means adding them later is
additive rather than a rewrite. That is the condition to keep true; if a change
breaks either property, these decisions need revisiting.

D1 and D3 are the opposite: genuine commitments. Passwordless makes email
infrastructure load-bearing, and free-first commits to converting users at a
limit that is currently very high.

## Consequences

**Easier:** billing is a small integration — a `stripeCustomerId` on `User`, a
Checkout route, and a webhook that sets `plan`. Limits already respond. No
password reset flow, no credential storage, no seat management UI.

**Harder:** email is now critical infrastructure; an outage or exceeded quota
means nobody signs in. Agencies wanting one invoice across several people have
no answer beyond "the lead pays".

**To revisit:** the free tier's limits before launching paid plans (D3); an org
layer the first time a customer asks to share billing (D4); Google sign-in if
signup analytics show inbox drop-off (D2).

## Action items

1. [ ] Add `stripeCustomerId` to `User` and a Checkout session route.
2. [ ] Handle `checkout.session.completed` and `customer.subscription.*` to set `User.plan`.
3. [ ] Decide free-tier limits before pricing goes live — 25 hubs is unlikely to convert anyone.
4. [ ] Add a sliding session refresh so active users are not logged out on day 91
       (`createSessionValue` currently runs only at verification).
5. [ ] Monitor Resend volume against the 100/day free tier before any launch push.
