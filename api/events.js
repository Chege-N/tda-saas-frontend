/**
 * api/events.js
 * =============
 * Protected proxy for POST /events (container event ingestion).
 * Each event ingestion counts as one request unit.
 */

import { withAuth } from './_middleware.js'

const TDA_API = process.env.TDA_API_URL ?? 'https://cheiincorporated-tda-supply-chain.hf.space'

export default withAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const event = req.body
  if (!event || !event.container_id) {
    return res.status(400).json({
      error: 'Invalid event — container_id is required',
      required_fields: ['container_id', 'origin_facility', 'destination_facility', 'lat', 'lon'],
    })
  }

  try {
    const upstream = await fetch(`${TDA_API}/events`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(event),
    })

    const data = await upstream.json()
    return res.status(upstream.ok ? 200 : 502).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'TDA engine unreachable', detail: err.message })
  }

}, { idempotent: true })
