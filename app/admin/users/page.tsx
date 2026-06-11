'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, ShieldOff, ShieldCheck } from 'lucide-react'

interface User {
  id: string; name: string; email: string; plan: string
  email_verified: boolean; status: string
  plan_expires_at: string | null; trial_started_at: string; created_at: string
  search_count: number; last_search_at: string | null
}
interface Pagination { page: number; limit: number; total: number; totalPages: number }

const PLAN_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  trial:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  starter: { bg: 'rgba(79,142,247,0.1)',  color: '#4f8ef7', border: 'rgba(79,142,247,0.3)' },
  growth:  { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
  annual:  { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
}
function planStyle(plan: string) {
  return PLAN_COLORS[plan] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.3)' }
}
function planStatus(u: User) {
  if (u.status === 'suspended') return 'suspended'
  const now = new Date()
  if (u.plan === 'trial') return new Date(new Date(u.trial_started_at).getTime() + 7 * 86400000) > now ? 'active' : 'expired'
  return u.plan_expires_at && new Date(u.plan_expires_at) > now ? 'active' : 'expired'
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }
function fmtRel(d: string | null) {
  if (!d) return '—'
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), limit: '20' })
    if (search)       p.set('search', search)
    if (filterPlan)   p.set('plan', filterPlan)
    if (filterStatus) p.set('status', filterStatus)
    try {
      const res = await fetch(`/api/admin/users?${p}`)
      if (res.status === 401) { window.location.href = '/login'; return }
      const data = await res.json()
      if (data.error) { setFetchError(data.error); return }
      setFetchError(null)
      if (data.users)      setUsers(data.users)
      if (data.pagination) setPagination(data.pagination)
    } finally { setLoading(false) }
  }, [search, filterPlan, filterStatus])

  useEffect(() => { fetchUsers(1) }, [fetchUsers])

  async function toggleSuspend(user: User) {
    const next = user.status === 'suspended' ? 'active' : 'suspended'
    const label = next === 'suspended' ? `Suspend ${user.name}?` : `Unsuspend ${user.name}?`
    if (!confirm(label)) return
    setActionLoading(user.id)
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: next } : u))
    setActionLoading(null)
  }

  const inputStyle = { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)', fontSize: '0.875rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Users</h1>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{pagination.total} total users</p>
      </div>

      {fetchError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.875rem', fontWeight: 500 }}>
          {fetchError}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '2rem' }} />
        </div>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={inputStyle}>
          <option value="">All plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="annual">Annual</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={() => fetchUsers(1)} style={{ ...inputStyle, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
          Search
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['User', 'Plan', 'Status', 'Searches', 'Last Active', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No users found</td></tr>
              ) : users.map((u, i) => {
                const ps = planStyle(u.plan)
                const status = planStatus(u)
                const isSuspended = u.status === 'suspended'
                const rowBg = isSuspended ? 'rgba(248,113,113,0.04)' : status === 'expired' ? 'rgba(248,113,113,0.02)' : status === 'active' && u.plan !== 'trial' ? 'rgba(16,185,129,0.02)' : undefined
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', background: rowBg }} className="user-row">
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 600, color: isSuspended ? 'var(--text-muted)' : 'var(--text)' }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</p>
                      {!u.email_verified && <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 600 }}>unverified</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, textTransform: 'capitalize' }}>
                        {u.plan}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isSuspended ? '#f87171' : status === 'active' ? '#10b981' : '#f87171' }}>
                        {isSuspended ? '⊘ Suspended' : status === 'active' ? '● Active' : '○ Expired'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: u.search_count > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                      {u.search_count}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtRel(u.last_search_at)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(u.created_at)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={actionLoading === u.id}
                        title={isSuspended ? 'Unsuspend user' : 'Suspend user'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.6rem',
                          borderRadius: '6px', border: '1px solid', cursor: 'pointer',
                          background: isSuspended ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.08)',
                          color: isSuspended ? '#10b981' : '#f87171',
                          borderColor: isSuspended ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)',
                          opacity: actionLoading === u.id ? 0.5 : 1,
                        }}>
                        {isSuspended ? <><ShieldCheck size={11} /> Restore</> : <><ShieldOff size={11} /> Suspend</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push('…')
                  acc.push(p); return acc
                }, [])
                .map((p, i) => p === '…' ? (
                  <span key={`e${i}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.3rem 0.25rem' }}>…</span>
                ) : (
                  <button key={p} onClick={() => fetchUsers(p as number)}
                    style={{ minWidth: '30px', height: '30px', borderRadius: '6px', border: '1px solid', fontSize: '0.8rem', fontWeight: p === pagination.page ? 700 : 400, cursor: 'pointer', background: p === pagination.page ? 'var(--accent)' : 'transparent', color: p === pagination.page ? '#fff' : 'var(--text-muted)', borderColor: p === pagination.page ? 'var(--accent)' : 'var(--border)' }}>
                    {p}
                  </button>
                ))
              }
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1}
                style={{ display: 'flex', alignItems: 'center', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', opacity: pagination.page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                style={{ display: 'flex', alignItems: 'center', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`.user-row:hover { background: var(--surface2) !important; }`}</style>
    </div>
  )
}
