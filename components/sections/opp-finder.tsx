'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Opportunity, OpportunitySearchFilters } from '@/lib/types'
import { OppCard } from '@/components/ui/opp-card'

interface OppFinderProps {
  onSaveOpp: (opp: Opportunity) => Promise<void> | void
}

const CATEGORIES = ['Grant', 'Scholarship', 'Incubator', 'Accelerator', 'Tender']
const REGIONS = ['Africa', 'Global', 'UK/Europe', 'US/Canada', 'Nigeria']
const DEADLINES = [
  { value: 'next3months', label: 'Next 3 months' },
  { value: 'thismonth', label: 'This month' },
  { value: 'open', label: 'Open / rolling' },
]

function ChipGroup({
  label, options, selected, onChange, colorMap,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  colorMap?: Record<string, string>
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      if (selected.length === 1) return
      onChange(selected.filter((s) => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-2"
             style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt)
          const accent = colorMap?.[opt] || 'var(--accent)'
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={active
                ? { background: accent, color: '#fff', borderColor: accent }
                : { background: 'var(--surface2)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function OppFinder({ onSaveOpp }: OppFinderProps) {
  const [filters, setFilters] = useState<OpportunitySearchFilters>({
    categories: [...CATEGORIES] as OpportunitySearchFilters['categories'],
    regions: [...REGIONS],
    deadline: 'next3months',
    keywords: '',
  })
  const [results, setResults] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingAll, setSavingAll] = useState(false)
  const [saveAllProgress, setSaveAllProgress] = useState<{ done: number; total: number } | null>(null)

  async function handleSave(opp: Opportunity) {
    await onSaveOpp(opp)
    setSavedIds((prev) => new Set(prev).add(opp.id))
  }

  async function handleSaveAll() {
    const unsaved = results.filter((o) => !savedIds.has(o.id))
    if (unsaved.length === 0) return
    setSavingAll(true)
    setSaveAllProgress({ done: 0, total: unsaved.length })
    for (let i = 0; i < unsaved.length; i++) {
      await handleSave(unsaved[i])
      setSaveAllProgress({ done: i + 1, total: unsaved.length })
    }
    setSavingAll(false)
  }

  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/opportunities/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.upgradeRequired) { window.location.href = '/pricing'; return }
        throw new Error(data.error)
      }
      setResults(data.opportunities.map((o: Opportunity, i: number) => ({
        ...o,
        id: `temp-${i}`,
        user_id: '',
        status: 'Saved' as const,
        source: 'ai_search',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })))
      setSavedIds(new Set())
      setSaveAllProgress(null)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <ChipGroup
          label="Category"
          options={CATEGORIES}
          selected={filters.categories as string[]}
          onChange={(categories) => setFilters({ ...filters, categories: categories as OpportunitySearchFilters['categories'] })}
        />
        <ChipGroup
          label="Region"
          options={REGIONS}
          selected={filters.regions || []}
          onChange={(regions) => setFilters({ ...filters, regions })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Deadline
            </label>
            <select value={filters.deadline} onChange={(e) => setFilters({ ...filters, deadline: e.target.value as OpportunitySearchFilters['deadline'] })}
                    className="w-full text-sm rounded-lg px-3 py-2 border"
                    style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {DEADLINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Keywords
            </label>
            <input
              type="text"
              placeholder="e.g. climate, fintech, women"
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
          {loading ? 'Searching global opportunities…' : 'Find Opportunities'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {searched && results.length === 0 && !loading && (
        <p style={{ color: 'var(--text-muted)' }}>No opportunities found. Try broader filters or different keywords.</p>
      )}

      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {results.length} opportunities found —{' '}
              {savedIds.size > 0
                ? <><strong style={{ color: 'var(--accent)' }}>{savedIds.size}</strong> saved</>
                : <>click <strong style={{ color: 'var(--accent)' }}>+ Save</strong> to add to your tracker</>}
            </p>
            {savedIds.size < results.length && (
              <button
                onClick={handleSaveAll}
                disabled={savingAll}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold border transition-opacity disabled:opacity-60"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(79,142,247,0.08)' }}
              >
                {savingAll && saveAllProgress
                  ? `Saving ${saveAllProgress.done}/${saveAllProgress.total}…`
                  : `Save All (${results.length - savedIds.size})`}
              </button>
            )}
            {savedIds.size === results.length && results.length > 0 && (
              <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>✓ All saved</span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((opp, i) => (
              <OppCard key={i} opp={opp} showSave isSaved={savedIds.has(opp.id)} onSave={handleSave} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
