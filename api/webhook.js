/**
 * api/webhook.js
 * ==============
 * Vercel serverless function — runs on the backend, never exposed to browser.
 *
 * Paystack calls this URL after every successful payment:
 *   POST https://tda-saas-frontend.vercel.app/api/webhook
 *
 * What it does:
 * 1. Verifies the request actually came from Paystack (HMAC-SHA512 signature)
 * 2. On charge.success event → upgrades the user's plan in Supabase
 * 3. Returns 200 so Paystack stops retrying
 */

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from './_middleware.js'
import { sendEmail } from './lib/mailer.js'
import { paymentSuccessEmail } from './lib/emails.js'

// ── Plan definitions (must match src/lib/paystack.js) ──────────────────────
const PLAN_REQUESTS = {
  starter:    1000,
  pro:        10000,
  enterprise: -1,      // -1 = unlimited
}

// ── Supabase admin client (uses service_role key — never expose to frontend) ─
function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

// ── Verify Paystack HMAC-SHA512 signature ──────────────────────────────────
function verifySignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('Missing PAYSTACK_SECRET_KEY')
  const hash = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex')
  return hash === signature
}

// ── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get raw body for signature verification
  const rawBody = JSON.stringify(req.body)
  const signature = req.headers['x-paystack-signature']

  // Verify signature — reject anything that didn't come from Paystack
  try {
    if (!verifySignature(rawBody, signature)) {
      console.error('Webhook signature verification failed')
      return res.status(401).json({ error: 'Invalid signature' })
    }
  } catch (err) {
    console.error('Signature check error:', err.message)
    return res.status(500).json({ error: 'Signature check failed' })
  }

  const event = req.body

  // ── Handle charge.success ──────────────────────────────────────────────
  if (event.event === 'charge.success') {
    const { reference, metadata, customer } = event.data
    const { user_id, plan } = metadata ?? {}

    console.log(`Payment success: ref=${reference} user=${user_id} plan=${plan}`)

    if (!user_id || !plan) {
      console.error('Missing user_id or plan in metadata')
      // Still return 200 — Paystack will retry on non-2xx
      return res.status(200).json({ received: true, warning: 'Missing metadata' })
    }

    const requests_limit = PLAN_REQUESTS[plan]
    if (requests_limit === undefined) {
      console.error(`Unknown plan: ${plan}`)
      return res.status(200).json({ received: true, warning: 'Unknown plan' })
    }

    // Upsert into user_plans table
    try {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('user_plans')
        .upsert({
          user_id,
          plan,
          requests_limit,
          requests_used:  0,
          payment_ref:    reference,
          email:          customer?.email ?? null,
          activated_at:   new Date().toISOString(),
          expires_at:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Supabase upsert error:', error.message)
        // Return 500 so Paystack retries
        return res.status(500).json({ error: 'Database error' })
      }

      console.log(`Plan upgraded: user=${user_id} → ${plan}`)

      // Send payment confirmation email — non-blocking, never fails the webhook
      const PLAN_PRICES_KES = { starter: 3800, pro: 10200, enterprise: 25700 }
      sendEmail(paymentSuccessEmail(
        customer?.email ?? '',
        plan,
        reference,
        PLAN_PRICES_KES[plan] ?? 0
      )).catch(e => console.error('[webhook] Email error:', e.message))

      return res.status(200).json({ received: true, upgraded: true })

    } catch (err) {
      console.error('Webhook handler error:', err.message)
      return res.status(500).json({ error: 'Internal error' })
    }
  }

  // All other events — acknowledge and ignore
  return res.status(200).json({ received: true })
}
