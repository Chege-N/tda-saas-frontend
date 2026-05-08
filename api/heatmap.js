/**
 * api/heatmap.js
 * ==============
 * Heatmap data — Pro and above only.
 * Returns per-node and per-edge anomaly weights.
 */

import { withAuth } from './_middleware.js'

const TDA_API = process.env.TDA_API_URL ?? 'https://cheiincorporated-tda-supply-chain.hf.space'

export default withAuth(async (req, res, ctx) => {
  // Restrict heatmap to Pro and Enterprise
  if (ctx.plan === 'free' || ctx.plan === 'starter') {
    return res.status(403).json({
      error:   'Heatmap is available on Pro and Enterprise plans',
      upgrade: 'https://tda-saas-frontend.vercel.app/#pricing',
    })
  }

  try {
    const r = await fetch(`${TDA_API}/heatmap`)
    const d = await r.json()
    return res.status(200).json(d)
  } catch (e) {
    return res.status(502).json({ error: 'TDA engine unreachable' })
  }
}, { skipPlanCheck: false })
