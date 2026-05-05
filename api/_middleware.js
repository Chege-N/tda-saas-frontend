/**
 * api/_middleware.js
 * ==================
 * Shared middleware used by every protected API route.
 *
 * Layers (applied in order):
 *   1. CORS headers
 *   2. Rate limiting  (IP-based, via Upstash Redis)
 *   3. Authentication (JWT from Supabase OR API key from DB)
 *   4. Plan enforcement (requests_used < requests_limit)
 *   5. Idempotency    (replay-safe via Idempotency-Key header)
 *   6. Usage increment (atomic counter after successful response)
 */

import { createClient } from '@supabase/supabase-js'
import { Ratelimit }    from '@upstash/ratelimit'
import { Redis }        from '@upstash/redis'

// ── Supabase admin client ──────────────────────────────────────────────────
export function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// ── Rate limiter (10 requests / 10 seconds per IP) ─────────────────────────
// Falls back gracefully if Upstash is not configured
let ratelimiter = null
function getRateLimiter() {
  if (ratelimiter) return ratelimiter
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  ratelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  })
  return ratelimiter
}

// ── CORS headers ───────────────────────────────────────────────────────────
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key,Idempotency-Key')
}

// ── Extract identity from request ──────────────────────────────────────────
// Supports two auth methods:
//   1. Bearer <supabase_jwt>  — web dashboard users
//   2. X-API-Key <key>        — programmatic / third-party access
async function getIdentity(req, supabase) {
  // Method 1: API Key
  const apiKey = req.headers['x-api-key']
  if (apiKey) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, name, is_active, last_used_at')
      .eq('key_hash', hashApiKey(apiKey))
      .single()

    if (error || !data) return { error: 'Invalid API key', status: 401 }
    if (!data.is_active)  return { error: 'API key is disabled', status: 403 }

    // Update last_used_at (non-blocking)
    supabase.from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', hashApiKey(apiKey))
      .then(() => {})

    return { user_id: data.user_id, method: 'api_key', key_name: data.name }
  }

  // Method 2: Supabase JWT
  const auth = req.headers['authorization'] ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return { error: 'No authentication provided', status: 401 }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { error: 'Invalid or expired token', status: 401 }

  return { user_id: user.id, method: 'jwt', email: user.email }
}

// ── Plan enforcement ───────────────────────────────────────────────────────
async function checkPlan(user_id, supabase) {
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan, requests_limit, requests_used, expires_at')
    .eq('user_id', user_id)
    .single()

  // No plan row = free tier defaults
  if (error || !data) {
    return { plan: 'free', requests_limit: 50, requests_used: 0, ok: true }
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ...data, ok: false, reason: 'Plan expired — please renew at tda-saas-frontend.vercel.app' }
  }

  // Check quota (-1 = unlimited)
  if (data.requests_limit !== -1 && data.requests_used >= data.requests_limit) {
    return { ...data, ok: false, reason: `Request limit reached (${data.requests_limit}/month) — upgrade your plan` }
  }

  return { ...data, ok: true }
}

// ── Idempotency ────────────────────────────────────────────────────────────
// If the same Idempotency-Key is seen within 24h, return the cached response
async function checkIdempotency(key, supabase) {
  if (!key) return null
  const { data } = await supabase
    .from('idempotency_keys')
    .select('response_body, created_at')
    .eq('key', key)
    .single()
  if (!data) return null
  // Keys expire after 24 hours
  const age = Date.now() - new Date(data.created_at).getTime()
  if (age > 24 * 60 * 60 * 1000) return null
  return JSON.parse(data.response_body)
}

async function saveIdempotency(key, user_id, responseBody, supabase) {
  if (!key) return
  await supabase.from('idempotency_keys').upsert({
    key,
    user_id,
    response_body: JSON.stringify(responseBody),
    created_at:    new Date().toISOString(),
  }, { onConflict: 'key' })
}

// ── Usage increment ────────────────────────────────────────────────────────
export async function incrementUsage(user_id, supabase) {
  await supabase.rpc('increment_requests_used', { p_user_id: user_id })
}

// ── API key hashing ────────────────────────────────────────────────────────
import crypto from 'crypto'
export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// ── Main middleware wrapper ────────────────────────────────────────────────
/**
 * withAuth(handler, options)
 *
 * Wraps a Vercel serverless handler with all security layers.
 *
 * Usage:
 *   export default withAuth(async (req, res, ctx) => {
 *     // ctx.user_id, ctx.plan, ctx.supabase available here
 *     res.json({ ok: true })
 *   })
 *
 * Options:
 *   skipPlanCheck: boolean  — skip quota enforcement (e.g. /health)
 *   idempotent:   boolean  — enable idempotency key support
 */
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    setCorsHeaders(res)

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    const supabase = getSupabaseAdmin()

    // ── 1. Rate limiting ──────────────────────────────────────────────────
    const limiter = getRateLimiter()
    if (limiter) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? 'unknown'
      const { success, limit, remaining, reset } = await limiter.limit(ip)
      res.setHeader('X-RateLimit-Limit',     limit)
      res.setHeader('X-RateLimit-Remaining', remaining)
      res.setHeader('X-RateLimit-Reset',     reset)
      if (!success) {
        return res.status(429).json({
          error: 'Too many requests',
          retry_after: Math.ceil((reset - Date.now()) / 1000),
        })
      }
    }

    // ── 2. Authentication ─────────────────────────────────────────────────
    const identity = await getIdentity(req, supabase)
    if (identity.error) {
      return res.status(identity.status).json({ error: identity.error })
    }

    // ── 3. Plan enforcement ───────────────────────────────────────────────
    let planData = { plan: 'free', requests_limit: 50, requests_used: 0, ok: true }
    if (!options.skipPlanCheck) {
      planData = await checkPlan(identity.user_id, supabase)
      if (!planData.ok) {
        return res.status(402).json({
          error:   'Plan limit reached',
          reason:  planData.reason,
          plan:    planData.plan,
          upgrade: 'https://tda-saas-frontend.vercel.app/#pricing',
        })
      }
    }

    // ── 4. Idempotency ────────────────────────────────────────────────────
    const idempotencyKey = req.headers['idempotency-key']
    if (options.idempotent && idempotencyKey) {
      const cached = await checkIdempotency(idempotencyKey, supabase)
      if (cached) {
        res.setHeader('X-Idempotent-Replayed', 'true')
        return res.status(200).json(cached)
      }
    }

    // ── 5. Call handler ───────────────────────────────────────────────────
    // Intercept res.json to capture response for idempotency + usage tracking
    const originalJson = res.json.bind(res)
    let responseCapture = null

    res.json = (body) => {
      responseCapture = body
      return originalJson(body)
    }

    const ctx = {
      user_id:  identity.user_id,
      method:   identity.method,
      plan:     planData.plan,
      supabase,
    }

    await handler(req, res, ctx)

    // ── 6. Post-response: save idempotency + increment usage ──────────────
    if (responseCapture && !options.skipPlanCheck) {
      if (options.idempotent && idempotencyKey) {
        await saveIdempotency(idempotencyKey, identity.user_id, responseCapture, supabase)
      }
      await incrementUsage(identity.user_id, supabase)
    }
  }
}
