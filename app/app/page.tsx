'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, List, LogOut, User, Zap } from 'lucide-react'
import { Finder } from '@/components/sections/finder'
import { Tracker } from '@/components/sections/tracker'
import { LagosEvent } from '@/lib/types'
import { TRIAL_SEARCHES } from '@/lib/plans'

type Tab = 'finder' | 'tracker'

interface CurrentUser { id: string; email: string; name: string }
interface PlanInfo { plan: string; status: string; daysLeft?: number; usage: { used: number; limit: number } }

export default function Home() {
  const [tab, setTab] = useState<Tab>('finder')
  const [trackerRefresh, setTrackerRefresh] = useState(0)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setCurrentUser(d.user))
    fetch('/api/payments/plan').then(r => r.ok ? r.json() : null).then(d => d && setPlanInfo(d))
  }, [])

  async function handleSaveEvent(event: LagosEvent) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, source: 'ai_search' }),
    })
    if (res.ok) {
      setTrackerRefresh(n => n + 1)
      alert(`"${event.name}" saved to your tracker!`)
    } else {
      alert('Failed to save event.')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const isTrial = planInfo?.plan === 'trial'
  const searchesLeft = planInfo ? planInfo.usage.limit - planInfo.usage.used : null
  const trialExpired = planInfo?.status === 'expired'

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="border-b px-6 py-3 flex items-center justify-between gap-3"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 1px 0 rgba(79,142,247,0.08)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Eventraka" width={130} height={34} priority unoptimized style={{ objectFit: 'contain' }} />
          <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline-block"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
            Nigeria
          </span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            {planInfo && (
              isTrial ? (
                <Link href="/pricing"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border"
                  style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
                  <Zap size={11} />
                  {trialExpired ? 'Trial expired' : `Trial · ${searchesLeft}/${TRIAL_SEARCHES} searches`}
                </Link>
              ) : planInfo.status === 'active' ? (
                <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                  {planInfo.plan.charAt(0).toUpperCase() + planInfo.plan.slice(1)} · {planInfo.daysLeft}d left
                </span>
              ) : (
                <Link href="/pricing"
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  Renew plan
                </Link>
              )
            )}

            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <User size={13} />
              <span className="hidden sm:inline">{currentUser.name}</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              title="Sign out">
              <LogOut size={13} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex gap-1 p-1 rounded-xl w-fit"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {([
            { id: 'finder', label: 'Find Events', icon: Search },
            { id: 'tracker', label: 'My Tracker', icon: List },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === id ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-muted)' }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === 'finder' && <Finder onSaveEvent={handleSaveEvent} />}
        {tab === 'tracker' && <Tracker refreshKey={trackerRefresh} />}
      </div>
    </main>
  )
}
