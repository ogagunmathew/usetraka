import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EventStatus, LagosEvent } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS: Record<string, string> = {
  // Current categories
  'Tech':         '#4f8ef7',
  'Fintech':      '#10b981',
  'Creative':     '#a855f7',
  'Tech Expo':    '#0ea5e9',
  'Investments':  '#f59e0b',
  'Other':        '#64748b',
  // Legacy (for existing saved events)
  'Tech/Startup': '#4f8ef7',
  'Tech/Policy':  '#6366f1',
  'Investment':   '#f59e0b',
  'Leadership':   '#f97316',
  'Product/UX':   '#4f8ef7',
  'Networking':   '#10b981',
  'Policy':       '#a855f7',
}

export const STATUS_STYLES: Record<EventStatus, { bg: string; text: string }> = {
  Registered: { bg: 'bg-emerald-900/30', text: 'text-emerald-400' },
  Interested: { bg: 'bg-blue-900/30',    text: 'text-blue-400' },
  Considering: { bg: 'bg-amber-900/30',  text: 'text-amber-400' },
  Attended:   { bg: 'bg-purple-900/30',  text: 'text-purple-400' },
  Declined:   { bg: 'bg-slate-800/60',   text: 'text-slate-400' },
}

export const ALL_STATUSES: EventStatus[] = [
  'Registered', 'Interested', 'Considering', 'Attended', 'Declined',
]

export const ALL_CATEGORIES: string[] = [
  'Tech', 'Fintech', 'Creative', 'Tech Expo', 'Investments', 'Other',
]

export const OPP_CATEGORY_COLORS: Record<string, string> = {
  'Grant':        '#10b981',
  'Scholarship':  '#8b5cf6',
  'Incubator':    '#4f8ef7',
  'Accelerator':  '#0ea5e9',
  'Tender':       '#f59e0b',
}

export const ALL_OPP_CATEGORIES = ['Grant', 'Scholarship', 'Incubator', 'Accelerator', 'Tender'] as const

export const ALL_OPP_REGIONS = ['Africa', 'Global', 'UK/Europe', 'US/Canada', 'Nigeria'] as const

export const OPP_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Saved:       { bg: 'bg-blue-900/30',    text: 'text-blue-400' },
  Applied:     { bg: 'bg-emerald-900/30', text: 'text-emerald-400' },
  Considering: { bg: 'bg-amber-900/30',   text: 'text-amber-400' },
  Awarded:     { bg: 'bg-purple-900/30',  text: 'text-purple-400' },
  Declined:    { bg: 'bg-slate-800/60',   text: 'text-slate-400' },
}

export function buildGoogleCalendarUrl(event: LagosEvent): string {
  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', event.name)

  const location = [event.venue, event.area].filter(Boolean).join(', ')
  if (location) params.set('location', location)

  const descParts: string[] = []
  if (event.organiser) descParts.push(`Organised by: ${event.organiser}`)
  if (event.cost) descParts.push(`Cost: ${event.cost}`)
  if (event.description) descParts.push(event.description)
  if (event.link) descParts.push(`Register: ${event.link}`)
  if (descParts.length) params.set('details', descParts.join('\n'))

  if (event.event_date) {
    params.set('dates', buildCalendarDates(event.event_date, event.event_time))
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildCalendarDates(dateStr: string, timeStr?: string | null): string {
  const d = new Date(dateStr)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const ymd = `${y}${m}${day}`

  const parsed = timeStr ? parseTime(timeStr) : null
  if (!parsed) {
    const next = new Date(d)
    next.setUTCDate(next.getUTCDate() + 1)
    const ny = next.getUTCFullYear()
    const nm = String(next.getUTCMonth() + 1).padStart(2, '0')
    const nd = String(next.getUTCDate()).padStart(2, '0')
    return `${ymd}/${ny}${nm}${nd}`
  }

  const { h, min } = parsed
  const startT = `${String(h).padStart(2, '0')}${String(min).padStart(2, '0')}00`
  const endH = h + 2
  const endT = `${String(endH % 24).padStart(2, '0')}${String(min).padStart(2, '0')}00`

  if (endH >= 24) {
    const next = new Date(d)
    next.setUTCDate(next.getUTCDate() + 1)
    const ny = next.getUTCFullYear()
    const nm = String(next.getUTCMonth() + 1).padStart(2, '0')
    const nd = String(next.getUTCDate()).padStart(2, '0')
    return `${ymd}T${startT}/${ny}${nm}${nd}T${endT}`
  }

  return `${ymd}T${startT}/${ymd}T${endT}`
}

function parseTime(t: string): { h: number; min: number } | null {
  const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return null
  let h = parseInt(match[1])
  const min = parseInt(match[2])
  const period = match[3]?.toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return { h, min }
}
