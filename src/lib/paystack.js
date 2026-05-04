import { useAuth } from '../context/AuthContext'

const PLANS = {
  starter:    { name: 'Starter',    price_usd: 29,  price_kes: 3800,  amount_kes: 380000,  requests: 1000  },
  pro:        { name: 'Pro',        price_usd: 79,  price_kes: 10200, amount_kes: 1020000, requests: 10000 },
  enterprise: { name: 'Enterprise', price_usd: 199, price_kes: 25700, amount_kes: 2570000, requests: -1   },
}

export function usePaystack() {
  const { user } = useAuth()

  function pay(planKey, onSuccess) {
    const plan = PLANS[planKey]
    if (!plan) throw new Error(`Unknown plan: ${planKey}`)

    // Paystack inline popup
    const handler = window.PaystackPop.setup({
      key:       import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:     user.email,
      amount:    plan.amount_kes,  // Paystack expects kobo/cents — already multiplied
      currency:  'KES',
      ref:       `tda_${planKey}_${Date.now()}`,
      metadata: {
        user_id:  user.id,
        plan:     planKey,
        requests: plan.requests,
      },
      callback: (response) => {
        // response.reference = payment reference
        onSuccess(response.reference, plan)
      },
      onClose: () => console.log('Payment window closed'),
    })
    handler.openIframe()
  }

  return { pay, PLANS }
}
