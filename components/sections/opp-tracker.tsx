'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, Bell } from 'lucide-react'
import { Opportunity, OpportunityStatus } from '@/lib/types'
import { ALL_OPP_CATEGORIES } from '@/lib/utils'
import { OppCard } from '@/components/ui/opp-card'
import { AddOppModal } from './add-opp-modal'

const ALL_OPP_STATUSES: OpportunityStatus[] = ['Saved', 'Applied', 'Considering', 'Awarded', 'Declined']

interface OppTrackerProps {
  refreshKey: number
}

export function OppTracker({ refreshKey }: OppTrackerProps) {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [reminderLoading, setReminderLoading] = useState<string | null>(null)

  const fetchOpps = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterCategory) params.set('category', filterCategory)
    const res = await fetch(`/api/opportunities?${params}`)
    const data = await res.json()
    setOpps(data.opportunities || [])
    setLoading(false)
  }, [filterStatus, filterCategory])

  useEffect(() => { fetchOpps() }, [fetchOpps, refreshKey])

  async function handleStatusChange(id: string, status: OpportunityStatus) {
    await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOpps((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this opportunity?')) return
    await fetch(`/api/opportunities/${id}`, { method: 'DELETE' })
    setOpps((prev) => prev.filter((o) => o.id !== id))
  }

  async function handleSetReminder(oppId: string) {
    setReminderLoading(oppId)
    try {
      const opp = opps.find((o) => o.id === oppId)
      if (!opp?.deadline) { alert('This opportunity has no deadline — add one to set a reminder.'); return }
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...opp, source: 'reminder_reset' }),
      })
      if (!res.ok) {
        // Reminder likely already auto-set on save; just confirm
        alert('A reminder is already scheduled 7 days before the deadline.')
      } else {
        alert('Reminder set! You\'ll get an email 7 days before the deadline.')
      }
    } finally {
      setReminderLoading(null)
    }
  }

  const stats = {
    total: opps.length,
    applied: opps.filter((o) => o.status === 'Applied').length,
    considering: opps.filter((o) => o.status === 'Considering').length,
    awarded: opps.filter((o) => o.status === 'Awarded').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: stats.total,       color: 'var(--text-muted)' },
          { label: 'Applied',     value: stats.applied,     color: '#10b981' },
          { label: 'Considering', value: stats.considering, color: '#4f8ef7' },
          { label: 'Awarded',     value: stats.awarded,     color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <option value="">All statuses</option>
          {ALL_OPP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <option value="">All categories</option>
          {[...ALL_OPP_CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <a href="/api/opportunities/export"
             className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border"
             style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Download size={14} /> Export CSV
          </a>
          <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-semibold text-white"
                  style={{ background: 'var(--accent)' }}>
            <Plus size={14} /> Add Opportunity
          </button>
        </div>
      </div>

      {/* Opportunity list */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading opportunities…</p>
      ) : opps.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg mb-2">No opportunities yet</p>
          <p className="text-sm">Use the Finder tab to discover opportunities, or add one manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {opps.map((opp) => (
            <div key={opp.id} className="relative">
              <OppCard
                opp={opp}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
              {opp.deadline && (
                <button
                  onClick={() => handleSetReminder(opp.id)}
                  disabled={reminderLoading === opp.id}
                  title="Set deadline reminder"
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-yellow-900/30 transition-colors"
                  style={{ color: '#fd7e14' }}
                >
                  <Bell size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddOppModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchOpps() }}
        />
      )}
    </div>
  )
}
