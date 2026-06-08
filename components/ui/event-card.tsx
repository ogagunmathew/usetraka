'use client'

import { Calendar, MapPin, Clock, DollarSign, ExternalLink, Trash2 } from 'lucide-react'
import { LagosEvent, EventStatus } from '@/lib/types'
import { CATEGORY_COLORS, ALL_STATUSES } from '@/lib/utils'
import { Badge } from './badge'
import { StatusBadge } from './status-badge'

interface EventCardProps {
  event: LagosEvent
  onStatusChange?: (id: string, status: EventStatus) => void
  onDelete?: (id: string) => void
  onSave?: (event: LagosEvent) => void
  showSave?: boolean
}

export function EventCard({ event, onStatusChange, onDelete, onSave, showSave }: EventCardProps) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3"
         style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--text)' }}>
          {event.name}
        </h3>
        <Badge label={event.category} color={CATEGORY_COLORS[event.category]} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {event.event_date && (
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {event.event_date} {event.event_day ? `(${event.event_day})` : ''}
          </span>
        )}
        {event.event_time && (
          <span className="flex items-center gap-1">
            <Clock size={13} /> {event.event_time}
          </span>
        )}
        {(event.venue || event.area) && (
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {[event.venue, event.area].filter(Boolean).join(', ')}
          </span>
        )}
        {event.cost && (
          <span className="flex items-center gap-1">
            <DollarSign size={13} /> {event.cost}
          </span>
        )}
      </div>

      {event.organiser && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          By {event.organiser}
        </p>
      )}

      {event.description && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          {event.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
        <div className="flex items-center gap-2">
          <StatusBadge status={event.status} />
          {onStatusChange && (
            <select
              value={event.status}
              onChange={(e) => onStatusChange(event.id, e.target.value as EventStatus)}
              className="text-xs rounded px-2 py-1 border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {event.link && (
            <a href={event.link} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
               style={{ background: 'var(--accent)', color: '#fff' }}>
              <ExternalLink size={12} /> Register
            </a>
          )}
          {showSave && onSave && (
            <button onClick={() => onSave(event)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium border"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              + Save
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(event.id)}
                    className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
