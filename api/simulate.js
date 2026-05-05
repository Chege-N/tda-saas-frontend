/**
 * api/simulate.js
 * ===============
 * Protected proxy for POST /simulate.
 * Enforces plan limits, rate limiting, idempotency.
 * Proxies to the HF Spaces TDA engine.
 */

import { withAuth } from './_middleware.js'

const TDA_API = process.env.TDA_API_URL ?? 'https://cheiincorporated-tda-supply-chain.hf.space'

// Plan-based limits on simulation size
const PLAN_LIMITS = {
  free:       { max_steps: 20,  max_nodes: 15  },
  starter:    { max_steps: 60,  max_nodes: 40  },
  pro:        { max_steps: 200, max_nodes: 100 },
  enterprise: { max_steps: 500, max_nodes: 500 },
}

export default withAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { scenario, n_steps, n_nodes } = req.body ?? {}

  // Validate inputs
  if (!scenario) {
    return res.status(400).json({ error: 'scenario is required' })
  }

  // Enforce plan-based simulation size limits
  const limits = PLAN_LIMITS[ctx.plan] ?? PLAN_LIMITS.free
  const steps  = Math.min(n_steps ?? 30, limits.max_steps)
  const nodes  = Math.min(n_nodes ?? 20, limits.max_nodes)

  if ((n_steps && n_steps > limits.max_steps) || (n_nodes && n_nodes > limits.max_nodes)) {
    res.setHeader('X-Plan-Limit-Applied', 'true')
    res.setHeader('X-Plan-Upgrade', 'https://tda-saas-frontend.vercel.app/#pricing')
  }

  // Proxy to TDA engine
  try {
    const upstream = await fetch(`${TDA_API}/simulate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ scenario, n_steps: steps, n_nodes: nodes }),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(502).json({ error: 'TDA engine error', detail: text })
    }

    const data = await upstream.json()

    // Add plan context to response
    return res.status(200).json({
      ...data,
      _meta: {
        plan:       ctx.plan,
        steps_used: steps,
        nodes_used: nodes,
        limits,
      },
    })
  } catch (err) {
    return res.status(502).json({ error: 'TDA engine unreachable', detail: err.message })
  }

}, { idempotent: true })
