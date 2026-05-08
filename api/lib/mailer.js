/**
 * api/lib/mailer.js
 * =================
 * Thin wrapper around the Resend SDK.
 * All email sending goes through sendEmail() — never call Resend directly.
 *
 * Falls back gracefully (logs only) if RESEND_API_KEY is not set,
 * so local dev and staging environments don't send real emails.
 */

import { Resend } from 'resend'

let resend = null

function getResend() {
  if (resend) return resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[mailer] RESEND_API_KEY not set — emails will be logged only')
    return null
  }
  resend = new Resend(key)
  return resend
}

/**
 * sendEmail({ from, to, subject, html })
 * Returns { id } on success or { error } on failure.
 * Never throws — email failures should not break API responses.
 */
export async function sendEmail({ from, to, subject, html }) {
  const client = getResend()

  if (!client) {
    console.log(`[mailer] WOULD SEND: to=${to} subject="${subject}"`)
    return { id: 'dev-mode-no-send' }
  }

  try {
    const { data, error } = await client.emails.send({ from, to, subject, html })
    if (error) {
      console.error('[mailer] Send failed:', error.message)
      return { error: error.message }
    }
    console.log(`[mailer] Sent: id=${data.id} to=${to} subject="${subject}"`)
    return { id: data.id }
  } catch (err) {
    console.error('[mailer] Exception:', err.message)
    return { error: err.message }
  }
}
