'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, Bell } from 'lucide-react'
import { LagosEvent, EventStatus } from '@/lib/types'
import { ALL_STATUSES, ALL_CATEGORIES } from '@/lib/utils'
import { EventCard } from '@/components/ui/event-card'
import { AddEventModal } from './add-event-modal'

interface TrackerProps {
  refreshKey: number
}

export function Tracker({ refreshKey }: TrackerProps) {
  const [events, setEvents] = useState<LagosEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [reminderLoading, setReminderLoading] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterCategory) params.set('category', filterCategory)
    const res = await fetch(`/api/events?${params}`)
    const data = await res.json()
    setEvents(data.events || [])
    setLoading(false)
  }, [filterStatus, filterCategory])

  useEffect(() => { fetchEvents() }, [fetchEvents, refreshKey])

  async function handleStatusChange(id: string, status: EventStatus) {
    await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status } : e))
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this event?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleSetReminder(eventId: string) {
    setReminderLoading(eventId)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      const data = await res.json()
      if (!res.ok) alert(data.error)
      else alert('Reminder set! You\'ll get an email 7 days before the event.')
    } finally {
      setReminderLoading(null)
    }
  }

  const stats = {
    total: events.length,
    registered: events.filter((e) => e.status === 'Registered').length,
    interested: events.filter((e) => e.status === 'Interested').length,
    attended: events.filter((e) => e.status === 'Attended').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',      value: stats.total,      color: 'var(--text-muted)' },
          { label: 'Registered', value: stats.registered, color: '#10b981' },
          { label: 'Interested', value: stats.interested, color: '#4f8ef7' },
          { label: 'Attended',   value: stats.attended,   color: '#a855f7' },
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
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <option value="">All categories</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <a href="/api/events/export"
             className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border"
             style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Download size={14} /> Export CSV
          </a>
          <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-semibold text-white"
                  style={{ background: 'var(--accent)' }}>
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Event list */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading events…</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg mb-2">No events yet</p>
          <p className="text-sm">Use the Finder tab to discover events, or add one manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <EventCard
                event={event}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
              <button
                onClick={() => handleSetReminder(event.id)}
                disabled={reminderLoading === event.id}
                title="Set 7-day email reminder"
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-yellow-900/30 transition-colors"
                style={{ color: '#fd7e14' }}
              >
                <Bell size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddEventModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchEvents() }}
        />
      )}
    </div>
  )
}
