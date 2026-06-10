'use client'

import { Calendar, MapPin, Clock, Banknote, ExternalLink, Trash2, Building2 } from 'lucide-react'
import { LagosEvent, EventStatus } from '@/lib/types'
import { CATEGORY_COLORS, ALL_STATUSES, buildGoogleCalendarUrl } from '@/lib/utils'
import { Badge } from './badge'
import { StatusBadge } from './status-badge'

interface EventCardProps {
  event: LagosEvent
  onStatusChange?: (id: string, status: EventStatus) => void
  onDelete?: (id: string) => void
  onSave?: (event: LagosEvent) => void
  showSave?: boolean
  isSaved?: boolean
}

export function EventCard({ event, onStatusChange, onDelete, onSave, showSave, isSaved }: EventCardProps) {
  const catColor = CATEGORY_COLORS[event.category] || '#64748b'

  return (
    <div
      className="event-card rounded-xl border flex flex-col gap-3 overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Coloured top strip */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${catColor}, ${catColor}66)` }} />

      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug flex-1" style={{ color: 'var(--text)' }}>
            {event.name}
          </h3>
          <Badge label={event.category} color={catColor} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {event.event_date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              {event.event_date}{event.event_day ? ` · ${event.event_day}` : ''}
            </span>
          )}
          {event.event_time && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              {event.event_time}
            </span>
          )}
          {(event.city || event.venue || event.area) && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              {[event.city, event.venue, event.area].filter(Boolean).join(', ')}
            </span>
          )}
          {event.cost && (
            <span className="flex items-center gap-1.5">
              <Banknote size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              {event.cost}
            </span>
          )}
          {event.organiser && (
            <span className="flex items-center gap-1.5">
              <Building2 size={12} style={{ flexShrink: 0 }} />
              {event.organiser}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap border-t"
             style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} />
            {onStatusChange && (
              <select
                value={event.status}
                onChange={(e) => onStatusChange(event.id, e.target.value as EventStatus)}
                className="text-xs rounded-lg px-2 py-1 border"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onStatusChange && event.event_date && (
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                title="Add to Google Calendar"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <Calendar size={12} /> Calendar
              </a>
            )}
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <ExternalLink size={12} /> Register
              </a>
            )}
            {showSave && (
              isSaved ? (
                <span className="text-xs px-3 py-1.5 rounded-lg font-medium border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', opacity: 0.6 }}>
                  ✓ Saved
                </span>
              ) : onSave && (
                <button
                  onClick={() => onSave(event)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold border"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-dim)' }}
                >
                  + Save
                </button>
              )
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-700/50"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
