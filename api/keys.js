/**
 * api/keys.js
 * ===========
 * API key management — generate, list, revoke.
 *
 * POST /api/keys          → generate a new API key
 * GET  /api/keys          → list all keys for the user
 * DELETE /api/keys?id=x   → revoke a key
 *
 * API keys allow programmatic access without browser auth.
 * Only the raw key is shown once on generation — we store the hash.
 */

import { withAuth, hashApiKey } from './_middleware.js'
import { randomBytes } from 'crypto'

function generateApiKey() {
  // Format: tda_live_<32 random hex chars>
  return `tda_live_${randomBytes(32).toString('hex')}`
}

export default withAuth(async (req, res, ctx) => {
  const { supabase, user_id } = ctx

  // ── POST: generate new key ───────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name } = req.body ?? {}
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required (e.g. "Production server")' })
    }

    // Limit: max 5 active keys per user
    const { count } = await supabase
      .from('api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (count >= 5) {
      return res.status(400).json({
        error: 'Maximum 5 active API keys per account. Revoke an existing key first.',
      })
    }

    const rawKey  = generateApiKey()
    const keyHash = hashApiKey(rawKey)
    const prefix  = rawKey.substring(0, 16) + '...'

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id,
        name:         name.trim(),
        key_hash:     keyHash,
        key_prefix:   prefix,
        is_active:    true,
        created_at:   new Date().toISOString(),
        last_used_at: null,
      })
      .select('id, name, key_prefix, created_at')
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create key', detail: error.message })
    }

    // Return the raw key ONCE — never stored, never retrievable again
    return res.status(201).json({
      ...data,
      key: rawKey,
      warning: 'Copy this key now — it will never be shown again.',
    })
  }

  // ── GET: list keys ───────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, created_at, last_used_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch keys' })
    }

    return res.status(200).json({ keys: data })
  }

  // ── DELETE: revoke key ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const keyId = req.query.id
    if (!keyId) {
      return res.status(400).json({ error: 'id query param required' })
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', user_id)   // Ensure user can only revoke their own keys

    if (error) {
      return res.status(500).json({ error: 'Failed to revoke key' })
    }

    return res.status(200).json({ revoked: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })

}, { skipPlanCheck: true })   // Key management doesn't cost a request unit
