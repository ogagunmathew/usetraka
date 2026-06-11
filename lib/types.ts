export type EventStatus = 'Registered' | 'Interested' | 'Considering' | 'Attended' | 'Declined'

export type EventCategory =
  | 'Tech'
  | 'Fintech'
  | 'Creative'
  | 'Tech Expo'
  | 'Investments'
  | 'Other'

export interface LagosEvent {
  id: string
  name: string
  category: EventCategory
  city: string | null
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
  categories: string[]
  cities: string[]
  timeframe?: string
  budget?: string
  keywords?: string
}

export type OpportunityStatus = 'Saved' | 'Applied' | 'Considering' | 'Awarded' | 'Declined'

export type OpportunityCategory = 'Grant' | 'Scholarship' | 'Incubator' | 'Accelerator' | 'Tender'

export interface Opportunity {
  id: string
  user_id: string
  title: string
  category: OpportunityCategory
  organiser: string | null
  deadline: string | null
  funding_amount: string | null
  eligibility: string | null
  description: string | null
  application_url: string | null
  country: string | null
  status: OpportunityStatus
  source: string
  created_at: string
  updated_at: string
}

export interface OpportunitySearchFilters {
  categories?: OpportunityCategory[]
  regions?: string[]
  deadline?: 'thismonth' | 'next3months' | 'open'
  keywords?: string
}
