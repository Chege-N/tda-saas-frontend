/**
 * api/health.js
 * =============
 * Public health check — no auth, no rate limit.
 * Used by Vercel, uptime monitors, and API consumers
 * to verify the service is running before sending requests.
 */

import { setCorsHeaders } from './_middleware.js'

export default async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' })

  // Optionally ping the TDA engine upstream
  let tdaStatus = 'unknown'
  try {
    const r = await fetch(
      `${process.env.TDA_API_URL ?? 'https://cheiincorporated-tda-supply-chain.hf.space'}/health`,
      { signal: AbortSignal.timeout(3000) }
    )
    tdaStatus = r.ok ? 'online' : 'degraded'
  } catch {
    tdaStatus = 'offline'
  }

  return res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   '1.0.4',
    services: {
      gateway: 'online',
      tda_engine: tdaStatus,
    },
  })
}
