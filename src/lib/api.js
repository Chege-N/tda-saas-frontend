const BASE = import.meta.env.VITE_API_URL

async function call(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  health:      ()       => call('GET',  '/health'),
  status:      ()       => call('GET',  '/status'),
  simulate:    (body)   => call('POST', '/simulate', body),
  ingestEvent: (body)   => call('POST', '/events',   body),
  alerts:      (n = 20) => call('GET',  `/alerts/recent?limit=${n}`),
  diagram:     ()       => call('GET',  '/diagram/latest'),
  heatmap:     ()       => call('GET',  '/heatmap'),
}
