import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'
import { PLANS } from '@/lib/plans'

function isAdmin(email: string) {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

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

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const result = await pool.query('SELECT * FROM plan_config ORDER BY months ASC')
    if (result.rows.length > 0) return NextResponse.json({ plans: result.rows })
  } catch { /* table may not exist yet */ }

  return NextResponse.json({ plans: DEFAULTS })
}

export async function PUT(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key, label, price_kobo, months, features, highlighted, tag } = await req.json()
  if (!key || !label || !price_kobo || !months) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await pool.query(`
    INSERT INTO plan_config (key, label, price_kobo, months, features, highlighted, tag, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, now())
    ON CONFLICT (key) DO UPDATE SET
      label = EXCLUDED.label,
      price_kobo = EXCLUDED.price_kobo,
      months = EXCLUDED.months,
      features = EXCLUDED.features,
      highlighted = EXCLUDED.highlighted,
      tag = EXCLUDED.tag,
      updated_at = now()
  `, [key, label, price_kobo, months, features ?? [], highlighted ?? false, tag ?? null])

  return NextResponse.json({ ok: true })
}
