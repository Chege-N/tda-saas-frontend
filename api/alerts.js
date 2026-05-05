/**
 * api/alerts.js
 * =============
 * Protected proxy for GET /alerts/recent.
 * Pro and above get more alerts returned.
 */

import { withAuth } from './_middleware.js'

const TDA_API = process.env.TDA_API_URL ?? 'https://cheiincorporated-tda-supply-chain.hf.space'

const PLAN_ALERT_LIMITS = {
  free:       10,
  starter:    50,
  pro:        200,
  enterprise: 1000,
}

export default withAuth(async (req, res, ctx) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const maxAlerts = PLAN_ALERT_LIMITS[ctx.plan] ?? 10
  const requested = Math.min(Number(req.query.limit ?? 20), maxAlerts)

  try {
    const upstream = await fetch(`${TDA_API}/alerts/recent?limit=${requested}`)
    const data = await upstream.json()
    return res.status(200).json({ ...data, _meta: { plan: ctx.plan, limit: requested } })
  } catch (err) {
    return res.status(502).json({ error: 'TDA engine unreachable', detail: err.message })
  }

}, { skipPlanCheck: false })
