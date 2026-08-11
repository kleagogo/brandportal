/**
 * Email sending — Resend when RESEND_API_KEY is set.
 *
 * Magic links are credentials: whoever holds one is signed in as that address.
 * So a link is only ever returned to the caller in development, where there is
 * no mail provider and the UI shows it directly ("Open your sign-in link").
 * In production a missing or broken provider is an error, not a fallback —
 * otherwise anyone could type someone else's address and be handed their link.
 *
 * Env:
 *   RESEND_API_KEY   the provider key; without it, no mail goes out
 *   EMAIL_FROM       "Basel <hello@yourdomain.com>" — must be a verified sender
 *   EMAIL_REPLY_TO   optional reply address
 *   ALLOW_DEV_LINKS  set to 1 to keep the dev-link fallback in production
 */

export interface SendResult {
  sent: boolean
  /** Development only — the UI surfaces this link when mail isn't configured. */
  devLink?: string
  /** Why the mail didn't go out, for the person who has to fix it. */
  error?: string
}

type Kind = 'login' | 'claim' | 'invite' | 'transfer'

const SUBJECTS: Record<Kind, (hub?: string) => string> = {
  login: () => 'Your Basel sign-in link',
  claim: hub => `Claim your brand hub${hub ? ` — ${hub}` : ''}`,
  invite: hub => `You've been invited to edit ${hub || 'a brand hub'}`,
  transfer: hub => `You've been offered ownership of ${hub || 'a brand hub'}`,
}

const ACTIONS: Record<Kind, string> = {
  login: 'Sign in',
  claim: 'Claim your hub',
  invite: 'Accept invite',
  transfer: 'Accept ownership',
}

const LEADS: Record<Kind, (hub?: string) => string> = {
  login: () => 'Click below to sign in. No password needed.',
  claim: hub => `Your brand hub${hub ? ` for ${hub}` : ''} is ready. Claim it to keep and edit it.`,
  invite: hub => `You can now edit ${hub || 'a brand hub'} — colors, type, logos, and files.`,
  transfer: hub => `Accept to become the owner of ${hub || 'this brand hub'}. The current owner stays on as an editor.`,
}

/** Are dev links (a magic link returned to the browser) acceptable here? */
function devLinksAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LINKS === '1'
}

export async function sendMagicLink(opts: {
  to: string
  url: string
  kind: Kind
  hubName?: string
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY

  if (!key) {
    if (devLinksAllowed()) return { sent: false, devLink: opts.url }
    console.error('[email] RESEND_API_KEY is not set — no sign-in emails can be sent')
    return { sent: false, error: 'Email isn’t configured on this deployment yet' }
  }

  const subject = SUBJECTS[opts.kind](opts.hubName)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Basel <onboarding@resend.dev>',
        to: opts.to,
        subject,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
        html: htmlBody(subject, LEADS[opts.kind](opts.hubName), ACTIONS[opts.kind], opts.url),
        text: textBody(subject, LEADS[opts.kind](opts.hubName), opts.url),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email] Resend rejected the send (${res.status}): ${detail.slice(0, 300)}`)
      // Common cause: EMAIL_FROM isn't a verified domain on the Resend account.
      if (devLinksAllowed()) return { sent: false, devLink: opts.url }
      return { sent: false, error: 'We couldn’t send that email — try again in a minute' }
    }
    return { sent: true }
  } catch (err) {
    console.error('[email] Send failed:', err)
    if (devLinksAllowed()) return { sent: false, devLink: opts.url }
    return { sent: false, error: 'We couldn’t send that email — try again in a minute' }
  }
}

function htmlBody(subject: string, lead: string, action: string, url: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f9f9f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f8;padding:40px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border:1px solid #e8e7e4;border-radius:16px">
          <tr><td style="padding:32px 32px 28px">
            <p style="margin:0 0 20px;font-size:13px;font-weight:600;letter-spacing:.02em;color:#1a1a1a">Basel</p>
            <h1 style="margin:0 0 8px;font-size:20px;line-height:1.25;font-weight:700;color:#1a1a1a">${subject}</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#6f6e6a">${lead}</p>
            <a href="${url}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600">${action}</a>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#b0afa9">
              This link works once and expires. If you didn't request it, you can ignore this email.
            </p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#b0afa9">Sent by Basel — brand hubs for agencies</p>
      </td></tr>
    </table>
  </body>
</html>`
}

function textBody(subject: string, lead: string, url: string): string {
  return `${subject}\n\n${lead}\n\n${url}\n\nThis link works once and expires. If you didn't request it, ignore this email.\n\n— Basel`
}
