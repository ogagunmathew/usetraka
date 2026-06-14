'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, Search, AlertTriangle, Activity, Zap } from 'lucide-react'

interface Stats {
  overview: { totalUsers: number; verified: number; newThisWeek: number; newThisMonth: number; activeTrials: number; activePaid: number; expired: number; expiringTrials: number }
  plans: { starter: number; growth: number; annual: number; revenueKobo: number }
  searches: { total: number; thisWeek: number; thisMonth: number }
  signupsByDay: Array<{ day: string; count: number }>
  opportunities: { totalSaved: number; savedThisWeek: number; applied: number; awarded: number; poolSize: number; byCategory: Record<string, number> }
}

const OPP_CAT_COLORS: Record<string, string> = {
  Grant: '#10b981', Scholarship: '#8b5cf6', Incubator: '#4f8ef7', Accelerator: '#0ea5e9', Tender: '#f59e0b',
}

function StatCard({ label, value, sub, delta, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  delta?: { value: number; label: string }; icon: React.ElementType; accent?: string
}) {
  const c = accent ?? 'var(--accent)'
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</p>
        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} style={{ color: c }} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{value}</p>
      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {sub && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</span>}
        {delta !== undefined && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: delta.value > 0 ? '#10b981' : 'var(--text-muted)' }}>
            {delta.value > 0 ? `↑ +${delta.value}` : '—'} {delta.label}
          </span>
        )}
      </div>
    </div>
  )
}

function Sparkline({ data }: { data: Array<{ day: string; count: number }> }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return { key, label: d.toLocaleDateString('en-NG', { weekday: 'short' }), count: data.find(x => x.day === key)?.count ?? 0 }
  })
  const max = Math.max(...days.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '52px' }}>
      {days.map(({ key, label, count }) => (
        <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}
          title={`${key}: ${count} signup${count !== 1 ? 's' : ''}`}>
          <div style={{ width: '100%', height: `${Math.max((count / max) * 80, count === 0 ? 5 : 12)}%`, background: count === 0 ? 'var(--border)' : 'var(--accent)', borderRadius: '3px 3px 0 0', opacity: count === 0 ? 0.4 : 0.9, minHeight: '3px' }} />
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1 }}>{label.slice(0, 2)}</span>
        </div>
      ))}
    </div>
  )
}

function PlanRing({ starter, growth, annual }: { starter: number; growth: number; annual: number }) {
  const total = starter + growth + annual || 1
  const s = (starter / total) * 360
  const g = (growth / total) * 360
  const gradient = `conic-gradient(#4f8ef7 0deg ${s}deg, #8b5cf6 ${s}deg ${s + g}deg, #10b981 ${s + g}deg 360deg)`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: gradient, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: '14px', borderRadius: '50%', background: 'var(--surface)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {[{ label: 'Starter', count: starter, color: '#4f8ef7' }, { label: 'Growth', count: growth, color: '#8b5cf6' }, { label: 'Annual', count: annual, color: '#10b981' }].map(({ label, count, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color, marginLeft: 'auto' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type CronState = 'idle' | 'running' | 'done' | 'error'

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading')
  const [cronEvents, setCronEvents] = useState<CronState>('idle')
  const [cronOpps, setCronOpps] = useState<CronState>('idle')
  const [cronResult, setCronResult] = useState<string>('')

  async function runCron(type: 'events' | 'opportunities') {
    const setter = type === 'events' ? setCronEvents : setCronOpps
    setter('running')
    setCronResult('')
    try {
      const res = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setter('error')
        setCronResult(data.detail || data.error || 'Failed')
      } else {
        setter('done')
        setCronResult(`${type === 'events' ? 'Events' : 'Opportunities'}: ${data.added ?? 0} added (${data.discovered ?? 0} discovered)`)
      }
    } catch {
      setter('error')
      setCronResult('Network error')
    }
  }

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (r.status === 401) { window.location.href = '/login'; throw new Error('unauth') } return r.ok ? r.json() : Promise.reject() })
      .then(d => { setStats(d); setStatus('ok') })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
      <div style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (status === 'error' || !stats) return <p style={{ color: 'var(--text-muted)' }}>Failed to load stats.</p>

  const { overview, plans, searches, signupsByDay, opportunities } = stats
  const revenueNaira = Math.round(plans.revenueKobo / 100)
  const activeUsers = overview.activeTrials + overview.activePaid
  const convPct = overview.totalUsers > 0 ? ((overview.activePaid / overview.totalUsers) * 100).toFixed(1) : '0.0'

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Dashboard</h1>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {overview.totalUsers} users · updated {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {overview.expiringTrials > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#f59e0b', fontWeight: 600 }}>
            {overview.expiringTrials} trial{overview.expiringTrials !== 1 ? 's' : ''} expiring within 48 hours
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.875rem', marginBottom: '0.875rem' }} className="dash-5col">
        <StatCard label="Total Users"  value={overview.totalUsers}  sub={`${overview.verified} verified`} delta={{ value: overview.newThisWeek, label: 'this week' }} icon={Users} />
        <StatCard label="Paid Users"   value={overview.activePaid}  sub={`${convPct}% conversion`}        icon={TrendingUp} accent="#10b981" />
        <StatCard label="Active Now"   value={activeUsers}          sub={`${overview.activeTrials} trial · ${overview.activePaid} paid`} icon={Activity} accent="#8b5cf6" />
        <StatCard label="Searches"     value={searches.total}       sub={`${searches.thisMonth}/mo`} delta={{ value: searches.thisWeek, label: 'this week' }} icon={Search} accent="#0ea5e9" />
        <StatCard label="Est. MRR"     value={`₦${revenueNaira.toLocaleString()}`} sub={`${overview.activePaid} active`} icon={TrendingUp} accent="#f59e0b" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }} className="dash-2col">

        {/* Signup sparkline */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>New signups — 7 days</p>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981' }}>+{overview.newThisWeek} this week</span>
          </div>
          <Sparkline data={signupsByDay} />
        </div>

        {/* Growth summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.875rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Growth summary</p>
          {[
            { label: 'New this week',  value: overview.newThisWeek,     color: '#10b981' },
            { label: 'New this month', value: overview.newThisMonth,    color: 'var(--accent)' },
            { label: 'Expired',        value: overview.expired,         color: '#f87171' },
            { label: 'Expiring 48h',   value: overview.expiringTrials,  color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan distribution + user status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }} className="dash-2col">

        {/* Paid plan ring */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Paid plan distribution</p>
          <PlanRing starter={plans.starter} growth={plans.growth} annual={plans.annual} />
        </div>

        {/* User status stacked bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>User status breakdown</p>
          <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.875rem' }}>
            <div title={`Paid: ${overview.activePaid}`}  style={{ width: `${(overview.activePaid / overview.totalUsers) * 100}%`,    background: '#10b981' }} />
            <div title={`Trial: ${overview.activeTrials}`} style={{ width: `${(overview.activeTrials / overview.totalUsers) * 100}%`,  background: '#f59e0b' }} />
            <div title={`Expired: ${overview.expired}`}  style={{ width: `${(overview.expired / overview.totalUsers) * 100}%`,        background: '#f87171' }} />
          </div>
          {[{ label: 'Active paid', count: overview.activePaid, color: '#10b981' }, { label: 'Active trial', count: overview.activeTrials, color: '#f59e0b' }, { label: 'Expired', count: overview.expired, color: '#f87171' }].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>{label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan tiles */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Plans</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.625rem' }} className="dash-5col">
          {[
            { label: 'Trial (active)',  value: overview.activeTrials, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
            { label: 'Trial (expired)', value: overview.expired,      bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
            { label: 'Starter',         value: plans.starter,         bg: 'rgba(79,142,247,0.1)',  color: '#4f8ef7', border: 'rgba(79,142,247,0.3)' },
            { label: 'Growth',          value: plans.growth,          bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
            { label: 'Annual',          value: plans.annual,          bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
          ].map(({ label, value, bg, color, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '0.75rem 0.875rem' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>{label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Discovery */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Discovery pool</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', flex: 1, minWidth: '200px' }}>
            Trigger AI discovery to populate the event and opportunity pools. Each run takes ~30–60 seconds.
          </p>
          {cronResult && (
            <span style={{ fontSize: '0.75rem', color: cronResult.includes('error') || cronResult.includes('Failed') ? '#f87171' : '#10b981', fontWeight: 600 }}>
              {cronResult}
            </span>
          )}
          <button
            onClick={() => runCron('events')}
            disabled={cronEvents === 'running'}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: cronEvents === 'running' ? 'var(--border)' : 'var(--accent)', color: cronEvents === 'running' ? 'var(--text-muted)' : '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: cronEvents === 'running' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
          >
            {cronEvents === 'running' ? 'Running…' : cronEvents === 'done' ? 'Events ✓' : 'Run Events'}
          </button>
          <button
            onClick={() => runCron('opportunities')}
            disabled={cronOpps === 'running'}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: cronOpps === 'running' ? 'var(--border)' : 'var(--accent)', color: cronOpps === 'running' ? 'var(--text-muted)' : '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: cronOpps === 'running' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
          >
            {cronOpps === 'running' ? 'Running…' : cronOpps === 'done' ? 'Opportunities ✓' : 'Run Opportunities'}
          </button>
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Opportunities</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.625rem', marginBottom: '0.625rem' }} className="dash-4col">
          {[{ label: 'Saved total', value: opportunities.totalSaved, color: '#4f8ef7' }, { label: 'This week', value: opportunities.savedThisWeek, color: '#4f8ef7' }, { label: 'Applied', value: opportunities.applied, color: '#10b981' }, { label: 'Awarded', value: opportunities.awarded, color: '#a855f7' }].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 0.875rem' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '0.625rem' }} className="dash-6col">
          {(['Grant','Scholarship','Incubator','Accelerator','Tender'] as const).map(cat => {
            const color = OPP_CAT_COLORS[cat]
            return (
              <div key={cat} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: '10px', padding: '0.625rem 0.75rem' }}>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color }}>{cat}</p>
                <p style={{ margin: 0, fontSize: '1.375rem', fontWeight: 900, color }}>{opportunities.byCategory[cat] ?? 0}</p>
              </div>
            )
          })}
          <div style={{ background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.25)', borderRadius: '10px', padding: '0.625rem 0.75rem' }}>
            <p style={{ margin: '0 0 0.2rem', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Pool</p>
            <p style={{ margin: 0, fontSize: '1.375rem', fontWeight: 900, color: '#6b7280' }}>{opportunities.poolSize}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) { .dash-5col { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 700px)  { .dash-5col { grid-template-columns: 1fr 1fr !important; } .dash-2col { grid-template-columns: 1fr !important; } .dash-4col { grid-template-columns: 1fr 1fr !important; } .dash-6col { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 480px)  { .dash-5col { grid-template-columns: 1fr !important; } .dash-6col { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </div>
  )
}
