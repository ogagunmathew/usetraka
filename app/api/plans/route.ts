import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { PLANS } from '@/lib/plans'

const SHARED_FEATURES = [
  'AI event search — Lagos, Abuja, PH, Kano, Abeokuta, Ilorin',
  'AI opportunity search — grants, scholarships, accelerators, tenders',
  '100 searches per month (events + opportunities)',
  'Personal tracker with status management',
  '7-day email reminders before deadlines & events',
  'Export to CSV · Add events to Google Calendar',
]
const DEFAULTS = [
  { key: 'starter', label: 'Starter', price_kobo: PLANS.starter.price, months: PLANS.starter.months, features: SHARED_FEATURES,                                    highlighted: false, tag: null },
  { key: 'growth',  label: 'Growth',  price_kobo: PLANS.growth.price,  months: PLANS.growth.months,  features: [...SHARED_FEATURES, 'Save 13% vs monthly'],        highlighted: true,  tag: 'Most Popular' },
  { key: 'annual',  label: 'Annual',  price_kobo: PLANS.annual.price,  months: PLANS.annual.months,  features: [...SHARED_FEATURES, 'Save 27% — best rate'],       highlighted: false, tag: 'Best Value' },
]

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM plan_config ORDER BY months ASC')
    if (result.rows.length > 0) return NextResponse.json({ plans: result.rows })
  } catch { /* plan_config table may not exist yet */ }
  return NextResponse.json({ plans: DEFAULTS })
}
