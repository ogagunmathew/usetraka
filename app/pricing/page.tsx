'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { TRIAL_DAYS, TRIAL_SEARCHES } from '@/lib/plans'
import { Logo } from '@/components/ui/logo'

interface PlanConfig {
  key: string; label: string; price_kobo: number; months: number
  features: string[]; highlighted: boolean; tag: string | null
}

interface UserPlan {
  plan: string
  plan_expires_at: string | null
  trial_started_at: string
  status: string
  daysLeft?: number
  usage: { used: number; limit: number }
}

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')

  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([])
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/payments/plan').then(r => r.ok ? r.json() : null).then(d => d && setUserPlan(d))
    fetch('/api/plans').then(r => r.ok ? r.json() : null).then(d => d?.plans && setPlanConfigs(d.plans))
  }, [])

  async function handleSubscribe(planId: string) {
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (res.status === 401) { router.push('/login'); return }
      if (data.authorization_url) window.location.href = data.authorization_url
    } catch {
      alert('Something went wrong — please try again')
    } finally {
      setLoadingPlan(null)
    }
  }

  const isTrialActive = userPlan?.plan === 'trial' && userPlan?.status === 'trial'
  const isTrialExpired = userPlan?.plan === 'trial' && userPlan?.status === 'expired'
  const searchesLeft = userPlan ? userPlan.usage.limit - userPlan.usage.used : TRIAL_SEARCHES

  const trialCard = {
    id: 'trial', name: 'Free Trial', price: 'Free',
    sub: `${TRIAL_DAYS} days · ${TRIAL_SEARCHES} searches`,
    tag: null, highlight: false,
    features: [
      'Events + Opportunities search',
      `${TRIAL_SEARCHES} searches (events & opportunities)`,
      `${TRIAL_DAYS}-day access · all features unlocked`,
      'No credit card required',
    ],
    priceKobo: 0,
  }

  const paidCards = planConfigs.map(p => {
    const naira = Math.round(p.price_kobo / 100)
    const perMonth = Math.round(naira / p.months)
    return {
      id: p.key, name: p.label,
      price: `₦${naira.toLocaleString()}`,
      sub: `${p.months} months · ₦${perMonth.toLocaleString()}/mo`,
      tag: p.tag, highlight: p.highlighted,
      features: p.features,
      priceKobo: p.price_kobo,
    }
  })

  const allCards = [trialCard, ...paidCards]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size="sm" />
        </Link>
        <Link href="/app" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to app
        </Link>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.25rem 4rem' }}>

        {/* Status banners */}
        {paymentStatus === 'success' && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '2rem', color: '#10b981', fontWeight: 500 }}>
            ✓ Payment successful — your plan is now active!
          </div>
        )}
        {paymentStatus === 'failed' && (
          <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.25)', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '2rem', color: '#4f8ef7' }}>
            Payment was not completed. Try again below.
          </div>
        )}
        {isTrialActive && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '2rem', color: '#f59e0b', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            ⚡ You&apos;re on a free trial — <strong>{userPlan?.daysLeft} day{userPlan?.daysLeft !== 1 ? 's' : ''}</strong> left, <strong>{searchesLeft} search{searchesLeft !== 1 ? 'es' : ''}</strong> remaining
          </div>
        )}
        {isTrialExpired && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '2rem', color: '#f87171', fontSize: '0.875rem' }}>
            Your trial has expired. Subscribe below to continue.
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.75rem' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>
            Start free. Upgrade when you&apos;re ready. No auto-renewals.
          </p>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          {allCards.map((card) => {
            const isCurrent = userPlan
              ? card.id === 'trial' ? userPlan.plan === 'trial' : userPlan.plan === card.id && userPlan.status === 'active'
              : false

            return (
              <div key={card.id} style={{
                background: card.highlight ? 'linear-gradient(145deg, #0d1a3a, #111e35)' : 'var(--surface)',
                border: `1px solid ${card.highlight ? 'rgba(79,142,247,0.4)' : isCurrent ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`,
                borderRadius: '16px',
                padding: '1.5rem',
                position: 'relative',
                boxShadow: card.highlight ? '0 0 0 1px rgba(79,142,247,0.12), 0 16px 40px rgba(79,142,247,0.1)' : 'none',
              }}>
                {/* Top tag */}
                {(card.tag || isCurrent) && (
                  <div style={{ marginBottom: '1rem' }}>
                    {isCurrent && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', letterSpacing: '0.04em' }}>
                        ✓ CURRENT PLAN
                      </span>
                    )}
                    {card.tag && !isCurrent && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', background: card.highlight ? '#4f8ef7' : 'rgba(245,158,11,0.15)', color: card.highlight ? '#fff' : '#f59e0b', border: card.highlight ? 'none' : '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.04em' }}>
                        {card.tag.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>{card.name}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: card.id === 'trial' ? '#10b981' : 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {card.price}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>{card.sub}</p>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', margin: '0 0 1.5rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {card.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      <Check size={13} style={{ color: card.id === 'trial' ? '#10b981' : '#4f8ef7', flexShrink: 0, marginTop: '2px' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {card.id === 'trial' ? (
                  isCurrent ? (
                    <div style={{ padding: '0.65rem', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Active trial
                    </div>
                  ) : (
                    <Link href={userPlan ? '#' : '/signup'} style={{ display: 'block', padding: '0.7rem', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none' }}>
                      {userPlan ? 'Trial used' : 'Start free trial'}
                    </Link>
                  )
                ) : (
                  <button
                    onClick={() => !isCurrent && handleSubscribe(card.id)}
                    disabled={!!loadingPlan || isCurrent}
                    style={{
                      width: '100%', padding: '0.7rem', borderRadius: '8px', border: 'none', cursor: isCurrent ? 'default' : 'pointer',
                      background: isCurrent ? 'var(--surface2)' : card.highlight ? '#4f8ef7' : 'rgba(79,142,247,0.1)',
                      color: isCurrent ? 'var(--text-muted)' : card.highlight ? '#fff' : '#4f8ef7',
                      fontWeight: 600, fontSize: '0.9rem',
                      outline: !card.highlight && !isCurrent ? '1px solid rgba(79,142,247,0.3)' : 'none',
                      opacity: loadingPlan && loadingPlan !== card.id ? 0.5 : 1,
                    }}
                  >
                    {isCurrent ? 'Current plan' : loadingPlan === card.id ? 'Redirecting…' : `Subscribe · ${card.price}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Payments processed securely by Paystack · Subscriptions do not auto-renew<br />
          Questions? <a href="mailto:hello@usetraka.com" style={{ color: '#4f8ef7', textDecoration: 'none' }}>hello@usetraka.com</a>
        </p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}
