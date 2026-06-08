'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { LagosEvent, SearchFilters } from '@/lib/types'
import { EventCard } from '@/components/ui/event-card'

interface FinderProps {
  onSaveEvent: (event: LagosEvent) => void
}

const CATEGORIES = ['All', 'Tech/Startup', 'Investment', 'Networking', 'Leadership', 'Product/UX', 'Fintech', 'Policy', 'Tech/Policy']
const TIMEFRAMES = [
  { value: '3months', label: 'Next 3 months' },
  { value: 'thismonth', label: 'This month' },
  { value: 'nextmonth', label: 'Next month' },
  { value: '6months', label: 'Next 6 months' },
]
const BUDGETS = [
  { value: 'any', label: 'Any budget' },
  { value: 'free', label: 'Free only' },
  { value: '25k', label: 'Under ₦25,000' },
]

export function Finder({ onSaveEvent }: FinderProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'All', timeframe: '3months', budget: 'any', keywords: '',
  })
  const [results, setResults] = useState<LagosEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/events/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.events.map((e: LagosEvent, i: number) => ({ ...e, id: `temp-${i}`, status: 'Interested', source: 'ai_search' })))
      setSearched(true)
    } catch (e) {
      setError('Search failed. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Category
            </label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full text-sm rounded-lg px-3 py-2 border"
                    style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Timeframe
            </label>
            <select value={filters.timeframe} onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
                    className="w-full text-sm rounded-lg px-3 py-2 border"
                    style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {TIMEFRAMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Budget
            </label>
            <select value={filters.budget} onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                    className="w-full text-sm rounded-lg px-3 py-2 border"
                    style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Keywords
            </label>
            <input
              type="text"
              placeholder="e.g. fintech, AI, pitch"
              value={filters.keywords}
              onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full text-sm rounded-lg px-3 py-2 border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Searching Lagos events…' : 'Find Events'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {searched && results.length === 0 && !loading && (
        <p style={{ color: 'var(--text-muted)' }}>No events found. Try broader filters.</p>
      )}

      {results.length > 0 && (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {results.length} events found — click <strong style={{ color: 'var(--accent)' }}>+ Save</strong> to add to your tracker
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((event, i) => (
              <EventCard key={i} event={event} showSave onSave={onSaveEvent} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
