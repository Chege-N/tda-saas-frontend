/**
 * api/diagram.js + api/heatmap.js combined
 * These are GET endpoints — low cost, Pro+ only for heatmap
 */

import { withAuth } from './_middleware.js'

const TDA_API = process.env.TDA_API_URL ?? 'https://cheiincorporated-tda-supply-chain.hf.space'

export const diagramHandler = withAuth(async (req, res) => {
  try {
    const r = await fetch(`${TDA_API}/diagram/latest`)
    const d = await r.json()
    return res.status(200).json(d)
  } catch (e) {
    return res.status(502).json({ error: 'TDA engine unreachable' })
  }
}, { skipPlanCheck: false })

export default diagramHandler
