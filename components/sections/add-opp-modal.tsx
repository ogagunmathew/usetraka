'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ALL_OPP_CATEGORIES } from '@/lib/utils'
import { OpportunityStatus } from '@/lib/types'

const ALL_OPP_STATUSES: OpportunityStatus[] = ['Saved', 'Applied', 'Considering', 'Awarded', 'Declined']

interface AddOppModalProps {
  onClose: () => void
  onSaved: () => void
}

export function AddOppModal({ onClose, onSaved }: AddOppModalProps) {
  const [form, setForm] = useState({
    title: '', category: 'Grant', organiser: '', deadline: '',
    funding_amount: '', eligibility: '', description: '',
    application_url: '', country: '', status: 'Saved' as OpportunityStatus,
  })
  const [saving, setSaving] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await fetch('/api/opportunities', {
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
          <h2 className="text-lg font-semibold">Add Opportunity Manually</h2>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>Title *</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
                   className={inputClass} style={inputStyle} placeholder="e.g. Tony Elumelu Foundation Grant 2026" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                      className={inputClass} style={inputStyle}>
                {[...ALL_OPP_CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as OpportunityStatus)}
                      className={inputClass} style={inputStyle}>
                {ALL_OPP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Organiser</label>
              <input value={form.organiser} onChange={(e) => set('organiser', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="Ford Foundation" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Country</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="USA / Nigeria / Global" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)}
                     className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Funding / Award</label>
              <input value={form.funding_amount} onChange={(e) => set('funding_amount', e.target.value)}
                     className={inputClass} style={inputStyle} placeholder="$50,000 | Equity-free" />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Eligibility</label>
            <input value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)}
                   className={inputClass} style={inputStyle} placeholder="Open to Nigerian startups under 3 years" />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Application URL</label>
            <input type="url" value={form.application_url} onChange={(e) => set('application_url', e.target.value)}
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
              {saving ? 'Saving…' : 'Save Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
