import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EventCategory, EventStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS: Record<EventCategory | string, string> = {
  'Tech/Startup': '#0d6efd',
  'Tech/Policy': '#6f42c1',
  'Investment': '#28a745',
  'Leadership': '#fd7e14',
  'Product/UX': '#e94560',
  'Networking': '#20c997',
  'Fintech': '#198754',
  'Policy': '#6610f2',
  'Other': '#6c757d',
}

export const STATUS_STYLES: Record<EventStatus, { bg: string; text: string }> = {
  Registered: { bg: 'bg-green-900/40', text: 'text-green-300' },
  Interested: { bg: 'bg-blue-900/40', text: 'text-blue-300' },
  Considering: { bg: 'bg-yellow-900/40', text: 'text-yellow-300' },
  Attended: { bg: 'bg-purple-900/40', text: 'text-purple-300' },
  Declined: { bg: 'bg-gray-800/60', text: 'text-gray-400' },
}

export const ALL_STATUSES: EventStatus[] = [
  'Registered', 'Interested', 'Considering', 'Attended', 'Declined',
]

export const ALL_CATEGORIES: EventCategory[] = [
  'Tech/Startup', 'Tech/Policy', 'Investment', 'Leadership',
  'Product/UX', 'Networking', 'Fintech', 'Policy', 'Other',
]
