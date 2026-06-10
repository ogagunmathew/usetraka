export const PLANS = {
  starter: { id: 'starter', name: 'Starter', months: 3,  price: 450000,  display: '₦4,500',  perMonth: '₦1,500/mo', savings: null },
  growth:  { id: 'growth',  name: 'Growth',  months: 6,  price: 780000,  display: '₦7,800',  perMonth: '₦1,300/mo', savings: 'Save 13%' },
  annual:  { id: 'annual',  name: 'Annual',  months: 12, price: 1320000, display: '₦13,200', perMonth: '₦1,100/mo', savings: 'Save 27%' },
} as const

export type PlanId = keyof typeof PLANS

export const TRIAL_DAYS = 7
export const TRIAL_SEARCHES = 2
export const PAID_SEARCHES_PER_MONTH = 100

export function getPlanStatus(user: {
  plan: string
  plan_expires_at: string | null
  trial_started_at: string
}): { status: 'trial' | 'active' | 'expired'; daysLeft?: number; expiresAt?: Date } {
  const now = new Date()

  if (user.plan === 'trial') {
    const trialStart = new Date(user.trial_started_at)
    const trialEnd = new Date(trialStart)
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)
    if (now > trialEnd) return { status: 'expired' }
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { status: 'trial', daysLeft, expiresAt: trialEnd }
  }

  if (user.plan_expires_at) {
    const expiry = new Date(user.plan_expires_at)
    if (now < expiry) {
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { status: 'active', daysLeft, expiresAt: expiry }
    }
  }

  return { status: 'expired' }
}
