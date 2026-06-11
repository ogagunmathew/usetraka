'use client'

import { useState, useEffect } from 'react'
import { Globe, Calendar, DollarSign, Tag, ExternalLink, RefreshCw } from 'lucide-react'

interface OppStat { label: string; value: number; color: string }
interface OppRow {
  id: string; title: string; category: string; organiser: string | null
  deadline: string | null; funding_amount: string | null; country: string | null
  status: string; source: string; created_at: string
}
interface PoolRow {
  id: string; title: string; category: string; organiser: string | null
  deadline: string | null; funding_amount: string | null; country: string | null
  source: string; created_at: string; application_url: string | null
}

const CAT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Grant':        { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  'Scholarship':  { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
  'Incubator':    { bg: 'rgba(79,142,247,0.1)',  color: '#4f8ef7', border: 'rgba(79,142,247,0.3)' },
  'Accelerator':  { bg: 'rgba(14,165,233,0.1)',  color: '#0ea5e9', border: 'rgba(14,165,233,0.3)' },
  'Tender':       { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
}
function catStyle(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.3)' }
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}
function deadlineUrgency(d: string | null): string {
  if (!d) return 'var(--text-muted)'
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0) return '#f87171'
  if (days < 14) return '#f59e0b'
  return 'var(--text-muted)'
}

export default function OpportunitiesAdminPage() {
  const [stats, setStats] = useState<OppStat[]>([])
  const [userOpps, setUserOpps] = useState<OppRow[]>([])
  const [pool, setPool] = useState<PoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'pool'>('overview')
  const [triggeringCron, setTriggeringCron] = useState(false)
  const [cronMsg, setCronMsg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [statsRes, poolRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/opportunities/pool'),
        ])
        const statsData = statsRes.ok ? await statsRes.json() : null
        const poolData  = poolRes.ok  ? await poolRes.json()  : null

        if (statsData?.opportunities) {
          const o = statsData.opportunities
          setStats([
            { label: 'Total saved',   value: o.total ?? 0,       color: '#4f8ef7' },
            { label: 'Active users',  value: o.usersWithOpps ?? 0, color: '#10b981' },
            { label: 'Grants',        value: o.byCategory?.Grant ?? 0,        color: '#10b981' },
            { label: 'Scholarships',  value: o.byCategory?.Scholarship ?? 0,  color: '#8b5cf6' },
            { label: 'Incubators',    value: o.byCategory?.Incubator ?? 0,    color: '#4f8ef7' },
            { label: 'Accelerators',  value: o.byCategory?.Accelerator ?? 0,  color: '#0ea5e9' },
            { label: 'Tenders',       value: o.byCategory?.Tender ?? 0,       color: '#f59e0b' },
            { label: 'Applied',       value: o.applied ?? 0,     color: '#f59e0b' },
            { label: 'Awarded',       value: o.awarded ?? 0,     color: '#10b981' },
          ])
          setUserOpps(statsData.opportunities.recent ?? [])
        }
        if (poolData?.pool) setPool(poolData.pool)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  async function triggerDiscover() {
    setTriggeringCron(true)
    setCronMsg(null)
    try {
      const res = await fetch('/api/cron/discover-opportunities', {
        headers: { Authorization: `Bearer ${prompt('Enter cron secret:') ?? ''}` }
      })
      setCronMsg(res.ok ? 'Discovery cron triggered successfully.' : `Failed: ${res.status}`)
    } catch { setCronMsg('Network error') }
    setTriggeringCron(false)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Opportunities</h1>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Intelligence pool and user opportunity activity.</p>
        </div>
        <button onClick={triggerDiscover} disabled={triggeringCron}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: 600, background: 'transparent', cursor: 'pointer', opacity: triggeringCron ? 0.6 : 1 }}>
          <RefreshCw size={13} style={{ animation: triggeringCron ? 'spin 1s linear infinite' : 'none' }} />
          {triggeringCron ? 'Running…' : 'Trigger discovery cron'}
        </button>
      </div>

      {cronMsg && (
        <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', marginBottom: '1rem', background: cronMsg.startsWith('Discovery') ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${cronMsg.startsWith('Discovery') ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`, color: cronMsg.startsWith('Discovery') ? '#10b981' : '#f87171', fontSize: '0.875rem', fontWeight: 600 }}>
          {cronMsg}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }} className="opp-stats-grid">
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.125rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{s.label}</p>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--surface2)', padding: '0.25rem', borderRadius: '10px', width: 'fit-content' }}>
        {(['overview', 'pool'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.4rem 1rem', borderRadius: '7px', border: 'none', fontSize: '0.8125rem', fontWeight: t === tab ? 700 : 400, cursor: 'pointer', background: t === tab ? 'var(--surface)' : 'transparent', color: t === tab ? 'var(--text)' : 'var(--text-muted)', boxShadow: t === tab ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}>
            {t === 'overview' ? 'User-saved opportunities' : `Pool (${pool.length} discovered)`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {userOpps.length === 0 ? (
            <p style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>No user-saved opportunities yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Title', 'Category', 'Organiser', 'Deadline', 'Funding', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userOpps.map((o, i) => {
                    const cs = catStyle(o.category)
                    return (
                      <tr key={o.id} style={{ borderBottom: i < userOpps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, maxWidth: '280px' }}>
                          <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{o.country ?? ''}</p>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
                            {o.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{o.organiser ?? '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: deadlineUrgency(o.deadline), whiteSpace: 'nowrap' }}>{fmtDate(o.deadline)}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{o.funding_amount ?? '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 600, color: o.status === 'Awarded' ? '#10b981' : o.status === 'Applied' ? '#4f8ef7' : 'var(--text-muted)' }}>
                          {o.status}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'pool' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {pool.length === 0 ? (
            <p style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              No pool entries yet. Trigger the discovery cron to populate.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Title', 'Category', 'Organiser', 'Deadline', 'Funding', 'Country', 'Link'].map(h => (
                      <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pool.map((p, i) => {
                    const cs = catStyle(p.category)
                    return (
                      <tr key={p.id} style={{ borderBottom: i < pool.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, maxWidth: '260px' }}>
                          <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{p.organiser ?? '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: deadlineUrgency(p.deadline), whiteSpace: 'nowrap' }}>{fmtDate(p.deadline)}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{p.funding_amount ?? '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.country ?? '—'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {p.application_url ? (
                            <a href={p.application_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                              <ExternalLink size={11} /> Apply
                            </a>
                          ) : <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 700px) { .opp-stats-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
