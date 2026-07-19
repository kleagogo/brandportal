/**
 * Email sending — Resend when RESEND_API_KEY is set, dev links otherwise.
 *
 * Without a key, no email goes out; instead the magic link is returned to the
 * caller so the UI can show it directly ("Open your sign-in link"). Every auth
 * flow works end-to-end either way — adding the key just makes it real email.
 */

interface SendResult {
  sent: boolean
  /** Present when email isn't configured — the UI surfaces this link. */
  devLink?: string
}

export async function sendMagicLink(opts: {
  to: string
  url: string
  kind: 'login' | 'claim' | 'invite'
  hubName?: string
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return { sent: false, devLink: opts.url }
  }

  const subjects = {
    login: 'Your sign-in link',
    claim: `Claim your brand hub${opts.hubName ? ` — ${opts.hubName}` : ''}`,
    invite: `You've been invited to edit ${opts.hubName || 'a brand hub'}`,
  }
  const actions = {
    login: 'Sign in',
    claim: 'Claim your hub',
    invite: 'Accept invite',
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Brand Portal <onboarding@resend.dev>',
      to: opts.to,
      subject: subjects[opts.kind],
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:32px 0">
          <p style="font-size:15px;color:#1a1a1a">${subjects[opts.kind]}</p>
          <p style="margin:24px 0">
            <a href="${opts.url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600">${actions[opts.kind]}</a>
          </p>
          <p style="font-size:12px;color:#8a8a85">This link works once and expires. If you didn't request it, ignore this email.</p>
        </div>`,
    }),
  })

  if (!res.ok) {
    // Email service failed — fall back to a dev link rather than a dead end.
    return { sent: false, devLink: opts.url }
  }
  return { sent: true }
}
