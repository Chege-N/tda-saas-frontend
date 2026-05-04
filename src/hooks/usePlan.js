import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const FREE_PLAN = {
  plan:           'free',
  requests_limit: 50,
  requests_used:  0,
  expires_at:     null,
}

export function usePlan() {
  const { user }              = useAuth()
  const [plan,    setPlan]    = useState(FREE_PLAN)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) setPlan(data)
        else setPlan({ ...FREE_PLAN, user_id: user.id })
        setLoading(false)
      })
  }, [user])

  const isPaid       = plan.plan !== 'free'
  const isExpired    = plan.expires_at && new Date(plan.expires_at) < new Date()
  const requestsLeft = plan.requests_limit === -1
    ? Infinity
    : plan.requests_limit - plan.requests_used

  return { plan, loading, isPaid, isExpired, requestsLeft }
}
