import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { usePaystack } from '../lib/paystack'
import { usePlan } from '../hooks/usePlan.js'

const SCENARIOS = [
  { key: 'suez_blockage',      label: 'Suez Blockage',       icon: '🚢' },
  { key: 'fraud_ring',         label: 'Fraud Ring',          icon: '🕵️' },
  { key: 'port_congestion',    label: 'Port Congestion',     icon: '⚓' },
  { key: 'customs_delay',      label: 'Customs Delay',       icon: '🛃' },
  { key: 'geopolitical_shock', label: 'Geopolitical Shock',  icon: '⚡' },
]

const SEVERITY_COLORS = {
  low:      'text-green-400  bg-green-900/30  border-green-800',
  medium:   'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  high:     'text-orange-400 bg-orange-900/30 border-orange-800',
  critical: 'text-red-400    bg-red-900/30    border-red-800',
}

function MetricCard({ label, value, sub, color = 'text-blue-400' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className={`text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-gray-300 font-medium">{label}</div>
      {sub && <div className="text-gray-500 text-sm mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user, signOut }  = useAuth()
  const { pay, PLANS }     = usePaystack()
  const { plan, requestsLeft, isExpired } = usePlan()

  const [scenario,  setScenario]  = useState('suez_blockage')
  const [steps,     setSteps]     = useState(30)
  const [nodes,     setNodes]     = useState(20)
  const [running,   setRunning]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const [apiHealth, setApiHealth] = useState(null)
  const [tab,       setTab]       = useState('simulate') // simulate | alerts | billing

  // Check API health on mount
  useEffect(() => {
    api.health()
      .then(() => setApiHealth('online'))
      .catch(() => setApiHealth('offline'))
  }, [])

  async function runSimulation() {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const data = await api.simulate({ scenario, n_steps: steps, n_nodes: nodes })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const anomalySteps = result?.timeline?.filter(t => t.is_anomaly) ?? []
  const summary      = result?.summary

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Top nav ── */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">TDA Supply Chain</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            apiHealth === 'online'
              ? 'text-green-400 bg-green-900/30 border-green-800'
              : 'text-red-400 bg-red-900/30 border-red-800'
          }`}>
            API {apiHealth ?? '...'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">{user?.email}</span>
          <button onClick={signOut}
            className="text-sm text-gray-400 hover:text-white transition">
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Plan status bar ── */}
      <div className={`px-6 py-2 text-sm flex items-center justify-between border-b ${
        isExpired
          ? 'bg-red-900/20 border-red-800 text-red-300'
          : plan.plan === 'free'
            ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
            : 'bg-green-900/20 border-green-800 text-green-300'
      }`}>
        <span>
          Plan: <strong className="capitalize">{plan.plan}</strong>
          {' · '}
          {requestsLeft === Infinity
            ? 'Unlimited requests'
            : `${requestsLeft} requests remaining`}
          {isExpired && ' · EXPIRED'}
        </span>
        {(plan.plan === 'free' || isExpired) && (
          <button onClick={() => setTab('billing')}
            className="underline hover:no-underline font-medium">
            Upgrade →
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-8">
          {[
            { key: 'simulate', label: '🔬 Simulate'   },
            { key: 'alerts',   label: '🔔 Alerts'     },
            { key: 'keys',     label: '🔑 API Keys'   },
            { key: 'billing',  label: '💳 Billing'    },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════ SIMULATE TAB ════════ */}
        {tab === 'simulate' && (
          <div className="space-y-8">

            {/* Controls */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6">Run Disruption Simulation</h2>
              <div className="grid md:grid-cols-3 gap-6">

                {/* Scenario picker */}
                <div className="md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-2">Scenario</label>
                  <div className="space-y-2">
                    {SCENARIOS.map(s => (
                      <button key={s.key} onClick={() => setScenario(s.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                          scenario === s.key
                            ? 'border-blue-500 bg-blue-900/20 text-white'
                            : 'border-gray-700 hover:border-gray-600 text-gray-300'
                        }`}>
                        <span>{s.icon}</span>
                        <span className="text-sm font-medium">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Steps: <span className="text-white font-semibold">{steps}</span>
                    </label>
                    <input type="range" min={10} max={60} value={steps}
                      onChange={e => setSteps(Number(e.target.value))}
                      className="w-full accent-blue-500" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10</span><span>60</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Network nodes: <span className="text-white font-semibold">{nodes}</span>
                    </label>
                    <input type="range" min={10} max={50} value={nodes}
                      onChange={e => setNodes(Number(e.target.value))}
                      className="w-full accent-blue-500" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10</span><span>50</span>
                    </div>
                  </div>

                  <button onClick={runSimulation} disabled={running}
                    className="mt-auto py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                               rounded-xl font-semibold text-lg transition">
                    {running ? '⏳ Running simulation...' : '▶ Run Simulation'}
                  </button>

                  {error && (
                    <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            {result && (
              <>
                {/* Summary metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    label="True Positives"
                    value={summary.true_positives}
                    sub="Disruptions caught"
                    color="text-green-400"
                  />
                  <MetricCard
                    label="False Positives"
                    value={summary.false_positives}
                    sub="False alarms"
                    color={summary.false_positives === 0 ? 'text-green-400' : 'text-red-400'}
                  />
                  <MetricCard
                    label="Disrupted Steps"
                    value={summary.n_disrupted_steps}
                    sub="Ground truth"
                    color="text-yellow-400"
                  />
                  <MetricCard
                    label="Anomalies Flagged"
                    value={anomalySteps.length}
                    sub="Total alerts fired"
                    color="text-blue-400"
                  />
                </div>

                {/* Timeline */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Detection Timeline — {SCENARIOS.find(s => s.key === scenario)?.label}
                  </h3>
                  <div className="flex gap-1 flex-wrap">
                    {result.timeline.map((t, i) => (
                      <div key={i}
                        title={`Step ${t.step} | score: ${t.anomaly_score?.toFixed(4)} | ${t.description}`}
                        className={`w-4 h-8 rounded cursor-pointer transition hover:opacity-70 ${
                          t.is_anomaly
                            ? 'bg-red-500'
                            : t.disrupted
                              ? 'bg-yellow-600'
                              : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-6 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-gray-700 inline-block"/>Normal
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-yellow-600 inline-block"/>Disrupted
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-red-500 inline-block"/>Alert fired
                    </span>
                  </div>
                </div>

                {/* Alert details */}
                {anomalySteps.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Alert Details ({anomalySteps.length} anomalies)
                    </h3>
                    <div className="space-y-3">
                      {anomalySteps.map((a, i) => (
                        <div key={i}
                          className={`p-4 rounded-xl border text-sm ${SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.low}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">
                              Step {a.step} — {a.severity?.toUpperCase()}
                            </span>
                            <span className="font-mono">
                              score: {a.anomaly_score?.toFixed(4)}
                            </span>
                          </div>
                          <p className="opacity-80">{a.description}</p>
                          {a.contributing_nodes?.length > 0 && (
                            <p className="mt-1 opacity-60 text-xs">
                              Affected nodes: {a.contributing_nodes.slice(0, 8).join(', ')}
                              {a.contributing_nodes.length > 8 && ` +${a.contributing_nodes.length - 8} more`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════ ALERTS TAB ════════ */}
        {tab === 'alerts' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Live Alerts</h2>
            <p className="text-gray-400 text-sm mb-6">
              Real-time anomaly alerts from your API instance.
              Run a simulation first, then check here.
            </p>
            <AlertsFeed />
          </div>
        )}

        {/* ════════ API KEYS TAB ════════ */}
        {tab === 'keys' && <ApiKeysTab userId={user?.id} />}

        {/* ════════ BILLING TAB ════════ */}
        {tab === 'billing' && (
          <BillingTab pay={pay} PLANS={PLANS} />
        )}
      </div>
    </div>
  )
}

/* ── Alerts feed component ── */
function AlertsFeed() {
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.alerts(20)
      .then(d => setAlerts(d.alerts ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400">Loading alerts...</p>
  if (error)   return <p className="text-red-400">Error: {error}</p>
  if (alerts.length === 0)
    return <p className="text-gray-400">No alerts yet — run a simulation first.</p>

  return (
    <div className="space-y-3">
      {alerts.filter(a => a.is_anomaly).map((a, i) => (
        <div key={i}
          className={`p-4 rounded-xl border text-sm ${SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.low}`}>
          <div className="flex justify-between mb-1">
            <span className="font-semibold">{a.severity?.toUpperCase()} — Anomaly Detected</span>
            <span className="font-mono opacity-70">{a.anomaly_score?.toFixed(4)}</span>
          </div>
          <p className="opacity-80">{a.description}</p>
        </div>
      ))}
    </div>
  )
}

/* ── API Keys Tab component ── */
function ApiKeysTab() {
  const { user } = useAuth()
  const [keys,    setKeys]    = useState([])
  const [loading, setLoading] = useState(true)
  const [name,    setName]    = useState('')
  const [newKey,  setNewKey]  = useState(null)   // shown once after generation
  const [error,   setError]   = useState('')
  const [creating, setCreating] = useState(false)

  async function fetchKeys() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const d = await res.json()
      setKeys(d.keys ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function createKey() {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    setNewKey(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ name }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setNewKey(d.key)
      setName('')
      fetchKeys()
    } catch (e) { setError(e.message) }
    finally { setCreating(false) }
  }

  async function revokeKey(id) {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`/api/keys?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    fetchKeys()
  }

  useEffect(() => { fetchKeys() }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-1">API Keys</h2>
        <p className="text-gray-400 text-sm mb-6">
          Use API keys to access your endpoints programmatically — no browser login needed.
          Pass as <code className="bg-gray-800 px-1 rounded text-blue-300">X-API-Key: tda_live_xxx</code> header.
        </p>

        {/* New key form */}
        <div className="flex gap-3 mb-6">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='Key name (e.g. "Production server")'
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl
                       focus:outline-none focus:border-blue-500 text-sm"
          />
          <button onClick={createKey} disabled={creating || !name.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                       rounded-xl text-sm font-medium transition">
            {creating ? 'Creating...' : '+ Generate Key'}
          </button>
        </div>

        {/* New key display — shown once */}
        {newKey && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-xl">
            <p className="text-green-300 font-semibold text-sm mb-2">
              ✓ Key generated — copy it now, it won't be shown again
            </p>
            <code className="block bg-gray-900 p-3 rounded-lg text-green-400 text-xs break-all select-all">
              {newKey}
            </code>
            <button onClick={() => navigator.clipboard.writeText(newKey)}
              className="mt-2 text-xs text-green-400 hover:underline">
              Copy to clipboard
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Key list */}
        {loading ? (
          <p className="text-gray-400 text-sm">Loading keys...</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-500 text-sm">No API keys yet. Generate one above.</p>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div>
                  <div className="font-medium text-sm">{k.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5 font-mono">{k.key_prefix}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    k.is_active
                      ? 'text-green-400 border-green-800 bg-green-900/20'
                      : 'text-gray-500 border-gray-700'
                  }`}>
                    {k.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {k.is_active && (
                    <button onClick={() => revokeKey(k.id)}
                      className="text-xs text-red-400 hover:underline">
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage example */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Usage Example</h3>
        <pre className="bg-gray-950 rounded-xl p-4 text-sm text-green-300 overflow-x-auto">{`curl -X POST https://tda-saas-frontend.vercel.app/api/simulate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: tda_live_your_key_here" \\
  -H "Idempotency-Key: unique-request-id-123" \\
  -d '{"scenario":"suez_blockage","n_steps":30,"n_nodes":20}'`}</pre>
      </div>
    </div>
  )
}
function BillingTab({ pay, PLANS }) {
  const [paying, setPaying] = useState(null)

  function handlePay(planKey) {
    setPaying(planKey)
    pay(planKey, (ref, plan) => {
      alert(`✅ Payment successful!\nPlan: ${plan.name}\nRef: ${ref}\n\nYour account will be upgraded within a few minutes.`)
      setPaying(null)
    })
    setPaying(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Upgrade Your Plan</h2>
        <p className="text-gray-400 text-sm">
          Pay securely with card or M-Pesa via Paystack.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => (
          <div key={key}
            className={`p-6 rounded-2xl border flex flex-col ${
              key === 'pro'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-800 bg-gray-900'
            }`}>
            {key === 'pro' && (
              <div className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-3">
                Most Popular
              </div>
            )}
            <div className="text-xl font-bold mb-1">{plan.name}</div>
            <div className="text-3xl font-bold mb-1">
              KES {plan.price_kes?.toLocaleString()}
              <span className="text-base text-gray-400">/mo</span>
            </div>
            <div className="text-gray-500 text-xs mb-1">(≈ ${plan.price_usd} USD)</div>
            <div className="text-gray-400 text-sm mb-6">
              {plan.requests === -1 ? 'Unlimited' : plan.requests.toLocaleString()} requests/month
            </div>
            <button
              onClick={() => handlePay(key)}
              disabled={paying === key}
              className={`mt-auto py-3 rounded-xl font-semibold transition ${
                key === 'pro'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-gray-700 hover:bg-gray-600'
              } disabled:opacity-50`}>
              {paying === key ? 'Opening payment...' : `Pay KES ${plan.price_kes?.toLocaleString()}/mo`}
            </button>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs text-center">
        Payments processed securely by Paystack · M-Pesa, Visa, Mastercard accepted
      </p>
    </div>
  )
}
