/**
 * api/signup-hook.js
 * ==================
 * Called by Supabase Auth webhook on new user signup.
 * Sends a welcome email.
 *
 * Configure in Supabase:
 *   Dashboard → Authentication → Hooks → After user created
 *   → HTTP POST → https://tda-saas-frontend.vercel.app/api/signup-hook
 */

import { sendEmail }   from './lib/mailer.js'
import { welcomeEmail } from './lib/emails.js'
import crypto from 'crypto'

function verifySupabaseWebhook(rawBody, signature) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET
  if (!secret) return true  // Skip verification if secret not set (dev mode)
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return hmac === signature
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify the request came from Supabase
  const sig = req.headers['x-supabase-signature'] ?? ''
  if (!verifySupabaseWebhook(JSON.stringify(req.body), sig)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const { record } = req.body ?? {}
  const email = record?.email
  const userId = record?.id

  if (!email) {
    return res.status(400).json({ error: 'No email in payload' })
  }

  console.log(`[signup-hook] New user: ${email} (${userId})`)

  // Send welcome email
  const result = await sendEmail(welcomeEmail(email, 'free'))
  console.log(`[signup-hook] Welcome email: ${result.id ?? result.error}`)

  return res.status(200).json({ received: true, email_sent: !result.error })
}
