export type EventStatus = 'Registered' | 'Interested' | 'Considering' | 'Attended' | 'Declined'

export type EventCategory =
  | 'Tech/Startup'
  | 'Tech/Policy'
  | 'Investment'
  | 'Leadership'
  | 'Product/UX'
  | 'Networking'
  | 'Fintech'
  | 'Policy'
  | 'Other'

export interface LagosEvent {
  id: string
  name: string
  category: EventCategory
  event_date: string | null
  event_day: string | null
  event_time: string | null
  venue: string | null
  area: string | null
  organiser: string | null
  cost: string | null
  link: string | null
  description: string | null
  status: EventStatus
  source: 'ai_search' | 'manual'
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  event_id: string
  remind_at: string
  channel: 'email' | 'calendar'
  calendar_event_id: string | null
  sent: boolean
  created_at: string
}

export interface SearchFilters {
  category?: string
  timeframe?: string
  budget?: string
  keywords?: string
}
