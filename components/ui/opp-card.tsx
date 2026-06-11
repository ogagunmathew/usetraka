'use client'

import { Calendar, ExternalLink, Trash2, Building2, Globe, Banknote, Users } from 'lucide-react'
import { Opportunity, OpportunityStatus } from '@/lib/types'
import { OPP_CATEGORY_COLORS, OPP_STATUS_STYLES } from '@/lib/utils'
import { Badge } from './badge'

const ALL_OPP_STATUSES: OpportunityStatus[] = ['Saved', 'Applied', 'Considering', 'Awarded', 'Declined']

function daysUntilDeadline(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function DeadlineChip({ deadline }: { deadline: string }) {
  const days = daysUntilDeadline(deadline)
  const formatted = new Date(deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

  let color = 'var(--text-muted)'
  let bg = 'transparent'
  let border = 'var(--border)'
  let prefix = '📅'

  if (days <= 7) {
    color = '#f87171'; bg = 'rgba(239,68,68,0.08)'; border = 'rgba(239,68,68,0.25)'; prefix = '🔴'
  } else if (days <= 21) {
    color = '#f59e0b'; bg = 'rgba(245,158,11,0.08)'; border = 'rgba(245,158,11,0.25)'; prefix = '🟡'
  }

  return (
    <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
          style={{ color, background: bg, border: `1px solid ${border}`, fontWeight: days <= 21 ? 600 : 400 }}>
      {prefix} Deadline: {formatted}{days <= 30 ? ` · ${days}d left` : ''}
    </span>
  )
}

interface OppCardProps {
  opp: Opportunity
  onStatusChange?: (id: string, status: OpportunityStatus) => void
  onDelete?: (id: string) => void
  onSave?: (opp: Opportunity) => void
  showSave?: boolean
  isSaved?: boolean
}

export function OppCard({ opp, onStatusChange, onDelete, onSave, showSave, isSaved }: OppCardProps) {
  const catColor = OPP_CATEGORY_COLORS[opp.category] || '#64748b'
  const statusStyle = OPP_STATUS_STYLES[opp.status] || OPP_STATUS_STYLES['Saved']

  return (
    <div
      className="opp-card rounded-xl border flex flex-col gap-3 overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Coloured top strip */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${catColor}, ${catColor}66)` }} />

      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug flex-1" style={{ color: 'var(--text)' }}>
            {opp.title}
          </h3>
          <Badge label={opp.category} color={catColor} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {opp.organiser && (
            <span className="flex items-center gap-1.5">
              <Building2 size={12} style={{ flexShrink: 0 }} />
              {opp.organiser}
            </span>
          )}
          {opp.country && (
            <span className="flex items-center gap-1.5">
              <Globe size={12} style={{ flexShrink: 0 }} />
              {opp.country}
            </span>
          )}
          {opp.funding_amount && (
            <span className="flex items-center gap-1.5">
              <Banknote size={12} style={{ color: catColor, flexShrink: 0 }} />
              {opp.funding_amount}
            </span>
          )}
          {opp.eligibility && (
            <span className="flex items-center gap-1.5">
              <Users size={12} style={{ flexShrink: 0 }} />
              {opp.eligibility}
            </span>
          )}
        </div>

        {opp.deadline && <DeadlineChip deadline={opp.deadline} />}

        {opp.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {opp.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap border-t"
             style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusStyle.bg} ${statusStyle.text}`}
                  style={{ borderColor: 'transparent' }}>
              {opp.status}
            </span>
            {onStatusChange && (
              <select
                value={opp.status}
                onChange={(e) => onStatusChange(opp.id, e.target.value as OpportunityStatus)}
                className="text-xs rounded-lg px-2 py-1 border"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {ALL_OPP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {opp.application_url && (
              <a
                href={opp.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: catColor, color: '#fff' }}
              >
                <ExternalLink size={12} /> Apply
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
                  onClick={() => onSave(opp)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold border"
                  style={{ borderColor: catColor, color: catColor, background: `${catColor}18` }}
                >
                  + Save
                </button>
              )
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(opp.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-700/50"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`.opp-card { transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; } .opp-card:hover { transform: translateY(-2px); border-color: var(--accent-border) !important; box-shadow: 0 0 0 1px var(--accent-border), 0 8px 24px rgba(79,142,247,0.1); }`}</style>
    </div>
  )
}
