/**
 * lib/emails.js
 * =============
 * HTML email templates for all transactional emails.
 * Clean, dark-themed, mobile-responsive.
 *
 * Templates:
 *   welcomeEmail(email, plan)
 *   quotaWarningEmail(email, plan, used, limit, percent)
 *   quotaExceededEmail(email, plan, limit)
 *   paymentSuccessEmail(email, plan, ref, amount)
 */

const BASE_URL  = 'https://tda-saas-frontend.vercel.app'
const DOCS_URL  = 'https://cheiincorporated-tda-supply-chain.hf.space/docs'
const FROM      = 'TDA Supply Chain <notifications@tda-supply-chain.io>'

// ── Shared layout wrapper ─────────────────────────────────────────────────
function layout(content, previewText) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${previewText}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d1117; font-family: -apple-system, BlinkMacSystemFont,
         'Segoe UI', Roboto, sans-serif; color: #e6edf3; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #161b22; border: 1px solid #30363d;
          border-radius: 12px; padding: 40px; }
  .logo { font-size: 20px; font-weight: 700; color: #58a6ff;
          margin-bottom: 32px; display: block; text-decoration: none; }
  h1 { font-size: 24px; font-weight: 700; color: #e6edf3; margin-bottom: 12px; }
  p  { font-size: 15px; line-height: 1.6; color: #8b949e; margin-bottom: 16px; }
  .btn { display: inline-block; padding: 12px 28px; background: #2563eb;
         color: #fff !important; text-decoration: none; border-radius: 8px;
         font-weight: 600; font-size: 15px; margin: 8px 0; }
  .btn-outline { background: transparent; border: 1px solid #30363d;
                 color: #8b949e !important; }
  .metric { background: #0d1117; border: 1px solid #21262d; border-radius: 8px;
            padding: 16px 20px; margin: 8px 0; }
  .metric-label { font-size: 12px; color: #8b949e; text-transform: uppercase;
                  letter-spacing: 0.5px; }
  .metric-value { font-size: 28px; font-weight: 700; color: #58a6ff; }
  .progress-bg { background: #21262d; border-radius: 999px;
                 height: 8px; margin: 16px 0; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 999px; }
  .divider { border: none; border-top: 1px solid #21262d; margin: 28px 0; }
  .footer { text-align: center; margin-top: 32px; }
  .footer p { font-size: 12px; color: #484f58; }
  .footer a { color: #58a6ff; text-decoration: none; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 999px;
         font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .tag-green  { background: #1a4731; color: #3fb950; }
  .tag-yellow { background: #3d2b00; color: #d29922; }
  .tag-red    { background: #4a1010; color: #f85149; }
  .tag-blue   { background: #1c2d4a; color: #58a6ff; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <a href="${BASE_URL}" class="logo">📦 TDA Supply Chain</a>
    ${content}
    <hr class="divider"/>
    <div class="footer">
      <p>
        <a href="${BASE_URL}/dashboard">Dashboard</a> ·
        <a href="${DOCS_URL}">API Docs</a> ·
        <a href="mailto:support@tda-supply-chain.io">Support</a>
      </p>
      <p style="margin-top:8px">
        © 2026 TDA Supply Chain · Built by
        <a href="https://github.com/Chege-N">Chege-N</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`
}

// ── 1. Welcome email ──────────────────────────────────────────────────────
export function welcomeEmail(email, plan = 'free') {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const content = `
    <h1>Welcome to TDA Supply Chain 🎉</h1>
    <p>
      Your account is live. You're on the
      <span class="tag tag-blue">${planLabel}</span> plan.
    </p>
    <p>
      Your API uses <strong>Topological Data Analysis</strong> to detect supply
      chain disruptions — port blockages, freight fraud, and geopolitical shocks —
      including fraud rings that produce zero delay signal.
    </p>

    <div class="metric">
      <div class="metric-label">Your plan</div>
      <div class="metric-value">${planLabel}</div>
    </div>

    <p style="margin-top:24px"><strong>Get started in 30 seconds:</strong></p>

    <pre style="background:#0d1117;border:1px solid #21262d;border-radius:8px;
                padding:16px;font-size:13px;color:#7ee787;overflow-x:auto;
                margin:12px 0;line-height:1.6">curl -X POST ${BASE_URL}/api/simulate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"scenario":"fraud_ring","n_steps":20,"n_nodes":15}'</pre>

    <a href="${BASE_URL}/dashboard" class="btn">Open Dashboard →</a>
    <a href="${DOCS_URL}" class="btn btn-outline" style="margin-left:12px">API Docs</a>

    <p style="margin-top:24px; font-size:13px; color:#484f58;">
      Need help? Reply to this email or contact
      <a href="mailto:support@tda-supply-chain.io" style="color:#58a6ff">
        support@tda-supply-chain.io</a>
    </p>`

  return {
    from:    FROM,
    to:      email,
    subject: 'Welcome to TDA Supply Chain — your API is ready',
    html:    layout(content, 'Your TDA Supply Chain API is ready'),
  }
}

// ── 2. Quota warning (80%) ────────────────────────────────────────────────
export function quotaWarningEmail(email, plan, used, limit, percent) {
  const planLabel   = plan.charAt(0).toUpperCase() + plan.slice(1)
  const remaining   = limit - used
  const barColor    = percent >= 90 ? '#f85149' : '#d29922'

  const content = `
    <h1>You've used ${percent}% of your monthly quota</h1>
    <p>
      Your <span class="tag tag-yellow">${planLabel}</span> plan includes
      <strong>${limit.toLocaleString()} requests/month</strong>.
      You have <strong>${remaining.toLocaleString()} requests remaining</strong>.
    </p>

    <div class="metric">
      <div class="metric-label">Requests used</div>
      <div class="metric-value" style="color:${barColor}">
        ${used.toLocaleString()} / ${limit.toLocaleString()}
      </div>
    </div>
    <div class="progress-bg">
      <div class="progress-fill"
           style="width:${percent}%;background:${barColor}"></div>
    </div>

    <p>
      When you reach 100%, API calls will return HTTP 402 until your quota
      resets next month — or until you upgrade.
    </p>

    <a href="${BASE_URL}/dashboard#billing" class="btn">Upgrade Plan →</a>
    <a href="${BASE_URL}/dashboard" class="btn btn-outline" style="margin-left:12px">
      View Usage
    </a>

    <p style="margin-top:24px; font-size:13px; color:#484f58;">
      Your quota resets on the 1st of each month.
      Upgrade anytime to get more requests immediately.
    </p>`

  return {
    from:    FROM,
    to:      email,
    subject: `⚠️ ${percent}% of your API quota used — ${remaining.toLocaleString()} requests left`,
    html:    layout(content, `You have ${remaining.toLocaleString()} API requests remaining`),
  }
}

// ── 3. Quota exceeded (100%) ─────────────────────────────────────────────
export function quotaExceededEmail(email, plan, limit) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  const content = `
    <h1>Your monthly quota is exhausted</h1>
    <p>
      Your <span class="tag tag-red">${planLabel}</span> plan's
      <strong>${limit.toLocaleString()} requests/month</strong> have been used.
      API calls are currently returning <code style="color:#f85149">HTTP 402</code>.
    </p>

    <div class="metric">
      <div class="metric-label">Status</div>
      <div class="metric-value" style="color:#f85149">Quota Exceeded</div>
    </div>

    <p>
      Upgrade now to restore access immediately.
      Your quota also resets on the 1st of next month.
    </p>

    <a href="${BASE_URL}/dashboard#billing" class="btn" style="background:#dc2626">
      Restore Access — Upgrade Now →
    </a>

    <hr class="divider"/>
    <p style="font-size:13px">
      <strong>Upgrade options:</strong>
    </p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">
      <tr style="color:#8b949e">
        <th style="text-align:left;padding:8px 0">Plan</th>
        <th style="text-align:left;padding:8px 0">Requests</th>
        <th style="text-align:left;padding:8px 0">Price</th>
      </tr>
      <tr style="border-top:1px solid #21262d">
        <td style="padding:10px 0">Starter</td>
        <td>1,000/mo</td>
        <td>KES 3,800</td>
      </tr>
      <tr style="border-top:1px solid #21262d">
        <td style="padding:10px 0">Pro</td>
        <td>10,000/mo</td>
        <td>KES 10,200</td>
      </tr>
      <tr style="border-top:1px solid #21262d">
        <td style="padding:10px 0;color:#58a6ff">Enterprise</td>
        <td style="color:#58a6ff">Unlimited</td>
        <td>KES 25,700</td>
      </tr>
    </table>`

  return {
    from:    FROM,
    to:      email,
    subject: '🚨 API access paused — quota exceeded',
    html:    layout(content, 'Your API quota is exhausted — upgrade to restore access'),
  }
}

// ── 4. Payment success ────────────────────────────────────────────────────
export function paymentSuccessEmail(email, plan, ref, amountKes) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  const content = `
    <h1>Payment confirmed ✓</h1>
    <p>
      Your <span class="tag tag-green">${planLabel}</span> plan is now active.
      Thank you for your payment.
    </p>

    <div class="metric">
      <div class="metric-label">Plan activated</div>
      <div class="metric-value" style="color:#3fb950">${planLabel}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
      <tr>
        <td style="padding:8px 0;color:#8b949e">Amount paid</td>
        <td style="padding:8px 0;text-align:right">KES ${amountKes?.toLocaleString()}</td>
      </tr>
      <tr style="border-top:1px solid #21262d">
        <td style="padding:8px 0;color:#8b949e">Plan</td>
        <td style="padding:8px 0;text-align:right">${planLabel}</td>
      </tr>
      <tr style="border-top:1px solid #21262d">
        <td style="padding:8px 0;color:#8b949e">Reference</td>
        <td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px">${ref}</td>
      </tr>
      <tr style="border-top:1px solid #21262d">
        <td style="padding:8px 0;color:#8b949e">Valid for</td>
        <td style="padding:8px 0;text-align:right">30 days</td>
      </tr>
    </table>

    <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard →</a>

    <p style="margin-top:24px;font-size:13px;color:#484f58">
      Keep this email as your payment receipt.
      Reference: <code>${ref}</code>
    </p>`

  return {
    from:    FROM,
    to:      email,
    subject: `✅ Payment confirmed — ${planLabel} plan activated`,
    html:    layout(content, `Your ${planLabel} plan is now active`),
  }
}
