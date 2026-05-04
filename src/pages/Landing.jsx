import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🔍',
    title: 'Detects What Others Miss',
    desc:  'Persistent homology (H₀ H₁ H₂) catches freight fraud rings that produce zero delay signal — invisible to every threshold-based tool.',
  },
  {
    icon: '⚡',
    title: 'Real-Time — Under 5 Minutes',
    desc:  'CUSUM adaptive thresholding with Wasserstein distance scoring. Alerts fire within 5 minutes of disruption onset.',
  },
  {
    icon: '🌍',
    title: '5 Disruption Scenarios',
    desc:  'Suez blockages, port congestion, fraud rings, customs delays, geopolitical shocks — all detected topologically.',
  },
  {
    icon: '🔗',
    title: 'REST API — Plug In Anywhere',
    desc:  'FastAPI endpoints for event ingestion, anomaly scoring, persistence diagrams, and heatmaps. Integrates with any ERP.',
  },
]

const PRICING = [
  {
    key:      'starter',
    name:     'Starter',
    price:    29,
    price_kes: 3800,
    requests: '1,000',
    features: ['All 5 disruption scenarios', 'REST API access', 'Anomaly alerts', 'Email support'],
    cta:      'Get Started',
    highlight: false,
  },
  {
    key:      'pro',
    name:     'Pro',
    price:    79,
    price_kes: 10200,
    requests: '10,000',
    features: ['Everything in Starter', 'Persistence diagrams', 'Network heatmaps', 'Priority support', 'Webhook alerts'],
    cta:      'Go Pro',
    highlight: true,
  },
  {
    key:      'enterprise',
    name:     'Enterprise',
    price:    199,
    price_kes: 25700,
    requests: 'Unlimited',
    features: ['Everything in Pro', 'Custom scenarios', 'Dedicated instance', 'SLA guarantee', 'Integration support'],
    cta:      'Contact Us',
    highlight: false,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-blue-400">TDA Supply Chain</span>
        <div className="flex gap-4">
          <Link to="/login"
            className="px-4 py-2 text-gray-300 hover:text-white transition">
            Sign In
          </Link>
          <Link to="/signup"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition">
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block px-3 py-1 bg-blue-900/40 border border-blue-700 rounded-full text-blue-300 text-sm mb-6">
          Powered by Topological Data Analysis
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Detect Supply Chain<br />
          <span className="text-blue-400">Disruptions Before</span><br />
          They Cost You Millions
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Real-time anomaly detection using persistent homology.
          Catches port blockages, freight fraud, and geopolitical shocks —
          including fraud rings that produce <strong className="text-white">zero delay signal</strong> and
          are invisible to every threshold-based system.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/signup"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition">
            Start Free Trial
          </Link>
          <a href="https://cheiincorporated-tda-supply-chain.hf.space/docs"
             target="_blank" rel="noreferrer"
             className="px-8 py-4 border border-gray-600 hover:border-gray-400 rounded-xl font-semibold text-lg transition">
            Live API Demo →
          </a>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">
          Why TDA beats conventional monitoring
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {FEATURES.map(f => (
            <div key={f.title}
              className="p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-700 transition">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          {[
            { val: '< 5 min', label: 'Detection latency' },
            { val: '0%',      label: 'False positive rate' },
            { val: '5',       label: 'Disruption scenarios' },
          ].map(s => (
            <div key={s.label} className="p-8 bg-gray-900 rounded-2xl border border-gray-800">
              <div className="text-4xl font-bold text-blue-400 mb-2">{s.val}</div>
              <div className="text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-6xl mx-auto px-6 py-20" id="pricing">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-14">
          Pay with card or M-Pesa. Cancel anytime.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {PRICING.map(p => (
            <div key={p.key}
              className={`p-8 rounded-2xl border flex flex-col ${
                p.highlight
                  ? 'bg-blue-900/20 border-blue-500 ring-2 ring-blue-500'
                  : 'bg-gray-900 border-gray-800'
              }`}>
              {p.highlight && (
                <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4">
                  Most Popular
                </div>
              )}
              <div className="text-2xl font-bold mb-1">{p.name}</div>
              <div className="text-4xl font-bold mb-1">
                KES {p.price_kes.toLocaleString()}
                <span className="text-lg text-gray-400">/mo</span>
              </div>
              <div className="text-gray-500 text-sm mb-1">≈ ${p.price} USD</div>
              <div className="text-gray-400 text-sm mb-6">
                {p.requests} API requests/month
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup"
                className={`w-full py-3 rounded-xl font-semibold text-center transition ${
                  p.highlight
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 py-10 text-center text-gray-500 text-sm">
        <p>TDA Supply Chain · Built by{' '}
          <a href="https://github.com/Chege-N" className="text-blue-400 hover:underline"
             target="_blank" rel="noreferrer">Chege-N</a>
        </p>
        <p className="mt-2">
          <a href="https://cheiincorporated-tda-supply-chain.hf.space/docs"
             className="hover:text-gray-300 transition" target="_blank" rel="noreferrer">
            API Docs
          </a>
          {' · '}
          <a href="https://github.com/Chege-N/TDA_Supply_Chain"
             className="hover:text-gray-300 transition" target="_blank" rel="noreferrer">
            GitHub
          </a>
          {' · '}
          <a href="https://rapidapi.com/ChegeN/api/tda-supply-chain-anomaly-detection"
             className="hover:text-gray-300 transition" target="_blank" rel="noreferrer">
            RapidAPI
          </a>
        </p>
      </footer>
    </div>
  )
}
