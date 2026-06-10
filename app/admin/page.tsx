'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, TrendingUp, Search, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'

interface Stats {
  overview: {
    totalUsers: number
    verified: number
    newThisWeek: number
    newThisMonth: number
    activeTrials: number
    activePaid: number
    expired: number
  }
  plans: {
    starter: number
    growth: number
    annual: number
    revenueKobo: number
  }
  searches: {
    total: number
    thisWeek: number
    thisMonth: number
  }
  users: Array<{
    id: string
    name: string
    email: string
    plan: string
    email_verified: boolean
    plan_expires_at: string | null
    trial_started_at: string
    created_at: string
    search_count: number
  }>
}

const PLAN_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  trial:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  starter: { bg: 'rgba(79,142,247,0.1)',  color: '#4f8ef7', border: 'rgba(79,142,247,0.3)' },
  growth:  { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
  annual:  { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
}

function planStyle(plan: string) {
  return PLAN_COLORS[plan] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.3)' }
}

function getPlanStatus(user: Stats['users'][0]) {
  const now = new Date()
  if (user.plan === 'trial') {
    const exp = new Date(new Date(user.trial_started_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    return exp > now ? 'active' : 'expired'
  }
  if (user.plan_expires_at && new Date(user.plan_expires_at) > now) return 'active'
  return 'expired'
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.375rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</p>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: accent ? `${accent}18` : 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color: accent ?? 'var(--accent)' }} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'error' | 'ok'>('loading')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 403) { setStatus('forbidden'); return }
      if (res.status === 401) { window.location.href = '/login'; return }
      if (!res.ok) { setStatus('error'); return }
      setStats(await res.json())
      setStatus('ok')
    } catch {
      setStatus('error')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (status === 'forbidden') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <ShieldCheck size={40} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9375rem' }}>You don&apos;t have admin access.</p>
        <Link href="/app" style={{ fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none' }}>← Back to app</Link>
      </div>
    )
  }

  if (status === 'error' || !stats) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Failed to load dashboard.</p>
        <button onClick={load} style={{ fontSize: '0.875rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
      </div>
    )
  }

  const { overview, plans, searches, users } = stats
  const revenueNaira = Math.round(plans.revenueKobo / 100)
  const activeUsers = overview.activeTrials + overview.activePaid

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 1.5rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/app">
            <Image src="/logo.png" alt="Eventraka" width={110} height={30} unoptimized style={{ objectFit: 'contain', display: 'block' }} />
          </Link>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.625rem', borderRadius: '999px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
            Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={load} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem 0.625rem', borderRadius: '6px' }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
          <Link href="/app" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={13} /> App
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* Page title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Dashboard</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {overview.totalUsers} total users · last updated {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Top stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }} className="stat-grid">
          <StatCard label="Total Users" value={overview.totalUsers} sub={`${overview.verified} verified`} icon={Users} />
          <StatCard label="Active Now" value={activeUsers} sub={`${overview.activeTrials} trial · ${overview.activePaid} paid`} icon={TrendingUp} accent="#10b981" />
          <StatCard label="Searches" value={searches.total} sub={`${searches.thisWeek} this week`} icon={Search} accent="#8b5cf6" />
          <StatCard label="Revenue" value={`₦${revenueNaira.toLocaleString()}`} sub={`${overview.activePaid} paid subscription${overview.activePaid !== 1 ? 's' : ''}`} icon={TrendingUp} accent="#f59e0b" />
        </div>

        {/* Plan breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }} className="plan-grid">
          {[
            { label: 'Trial (active)', value: overview.activeTrials, plan: 'trial' },
            { label: 'Trial (expired)', value: overview.expired, plan: 'trial' },
            { label: 'Starter', value: plans.starter, plan: 'starter' },
            { label: 'Growth', value: plans.growth, plan: 'growth' },
            { label: 'Annual', value: plans.annual, plan: 'annual' },
          ].map(({ label, value, plan }) => {
            const s = planStyle(plan)
            return (
              <div key={label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '0.875rem 1rem' }}>
                <p style={{ margin: '0 0 0.375rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.color }}>{label}</p>
                <p style={{ margin: 0, fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.04em', color: s.color }}>{value}</p>
              </div>
            )
          })}
        </div>

        {/* User table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Users</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing {users.length} most recent</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['User', 'Plan', 'Status', 'Searches', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '0.625rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const s = planStyle(u.plan)
                  const userStatus = getPlanStatus(u)
                  return (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}
                      className="table-row">
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{u.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</p>
                        {!u.email_verified && (
                          <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>unverified</span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '999px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize' }}>
                          {u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: userStatus === 'active' ? '#10b981' : '#f87171' }}>
                          {userStatus === 'active' ? '● Active' : '○ Expired'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: u.search_count > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                          {u.search_count}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmt(u.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .table-row:hover { background: var(--surface2) !important; }
        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
          .plan-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .stat-grid { grid-template-columns: 1fr !important; }
          .plan-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
