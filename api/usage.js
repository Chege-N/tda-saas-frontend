/**
 * api/usage.js
 * ============
 * Returns current usage stats for the authenticated user.
 * Used by the dashboard to show the plan status bar.
 */

import { withAuth } from './_middleware.js'

export default withAuth(async (req, res, ctx) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { data } = await ctx.supabase
    .from('user_plans')
    .select('plan, requests_limit, requests_used, expires_at, activated_at')
    .eq('user_id', ctx.user_id)
    .single()

  const plan = data ?? {
    plan:           'free',
    requests_limit: 50,
    requests_used:  0,
    expires_at:     null,
  }

  const pct = plan.requests_limit === -1
    ? 0
    : Math.round((plan.requests_used / plan.requests_limit) * 100)

  return res.status(200).json({
    ...plan,
    requests_remaining: plan.requests_limit === -1
      ? 'unlimited'
      : plan.requests_limit - plan.requests_used,
    usage_percent: pct,
    is_expired:    plan.expires_at ? new Date(plan.expires_at) < new Date() : false,
  })

}, { skipPlanCheck: true })
