'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ALL_CATEGORIES, ALL_STATUSES } from '@/lib/utils'

interface AddEventModalProps {
  onClose: () => void
  onSaved: () => void
}

export function AddEventModal({ onClose, onSaved }: AddEventModalProps) {
  const [form, setForm] = useState({
    name: '', category: 'Tech/Startup', event_date: '', event_day: '',
    event_time: '', venue: '', area: '', organiser: '', cost: '',
    link: '', description: '', status: 'Interested',
  })
  const [saving, setSaving] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, source: 'manual' }),
    })
    setSaving(false)
    onSaved()
  }

  const inputClass = "w-full text-sm rounded-lg px-3 py-2 border"
  const inputStyle = { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }
  const labelClass = "text-xs font-semibold uppercase tracking-wide block mb-1"
  const labelStyle = { color: 'var(--text-muted)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
           style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Event Manually</h2>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>Event Name *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                   className={inputClass} style={inputStyle} placeholder="e.g. Lagos Startup Summit 2026" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                      className={inputClass} style={inputStyle}>
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                      className={inputClass} style={inputStyle}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Date</label>
              <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)}
                     className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Time</label>
              <input type="text" value={form.event_time} onChange={(e) => set('event_time', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="e.g. 09:00 AM" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Venue</label>
              <input value={form.venue} onChange={(e) => set('venue', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="Landmark Event Centre" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Area / LGA</label>
              <input value={form.area} onChange={(e) => set('area', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="Victoria Island" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Organiser</label>
              <input value={form.organiser} onChange={(e) => set('organiser', e.target.value)}
                     className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Cost</label>
              <input value={form.cost} onChange={(e) => set('cost', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="Free | ₦15,000" />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Registration Link</label>
            <input type="url" value={form.link} onChange={(e) => set('link', e.target.value)}
                   className={inputClass} style={inputStyle} placeholder="https://..." />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                      rows={3} className={inputClass} style={inputStyle} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="px-4 py-2 text-sm rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="px-5 py-2 text-sm rounded-lg font-semibold text-white disabled:opacity-60"
                    style={{ background: 'var(--accent)' }}>
              {saving ? 'Saving…' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
