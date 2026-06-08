'use client'

import { useState } from 'react'
import { MapPin, Search, List } from 'lucide-react'
import { Finder } from '@/components/sections/finder'
import { Tracker } from '@/components/sections/tracker'
import { LagosEvent } from '@/lib/types'

type Tab = 'finder' | 'tracker'

export default function Home() {
  const [tab, setTab] = useState<Tab>('finder')
  const [trackerRefresh, setTrackerRefresh] = useState(0)

  async function handleSaveEvent(event: LagosEvent) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, source: 'ai_search' }),
    })
    if (res.ok) {
      setTrackerRefresh((n) => n + 1)
      alert(`"${event.name}" saved to your tracker!`)
    } else {
      alert('Failed to save event.')
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-3"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <MapPin size={20} style={{ color: 'var(--accent)' }} />
          <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>Lagos Events</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full ml-1"
              style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
          Mathew&apos;s Intelligence
        </span>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {([
            { id: 'finder', label: 'Find Events', icon: Search },
            { id: 'tracker', label: 'My Tracker', icon: List },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === id
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--text-muted)' }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'finder' && <Finder onSaveEvent={handleSaveEvent} />}
        {tab === 'tracker' && <Tracker refreshKey={trackerRefresh} />}
      </div>
    </main>
  )
}
