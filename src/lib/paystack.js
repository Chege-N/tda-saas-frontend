import { useAuth } from '../context/AuthContext'

const PLANS = {
  starter: { name: 'Starter',    price: 29,  amount: 2900,  requests: 1000  },
  pro:     { name: 'Pro',        price: 79,  amount: 7900,  requests: 10000 },
  enterprise: { name: 'Enterprise', price: 199, amount: 19900, requests: -1 },
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
      amount:    plan.amount * 100,  // Paystack expects kobo/cents
      currency:  'USD',
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
