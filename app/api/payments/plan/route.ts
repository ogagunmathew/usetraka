import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'
import { TRIAL_SEARCHES, getPlanStatus } from '@/lib/plans'

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(
    'SELECT plan, plan_expires_at, trial_started_at FROM users WHERE id = $1',
    [user.id]
  )
  const row = result.rows[0]
  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const planStatus = getPlanStatus(row)

  const usageQuery = row.plan === 'trial'
    ? await pool.query('SELECT COUNT(*) FROM search_usage WHERE user_id = $1', [user.id])
    : await pool.query(
        `SELECT COUNT(*) FROM search_usage WHERE user_id = $1 AND searched_at >= date_trunc('month', now())`,
        [user.id]
      )
  const used = parseInt(usageQuery.rows[0].count, 10)
  const limit = row.plan === 'trial' ? TRIAL_SEARCHES : 100

  return NextResponse.json({
    plan: row.plan,
    plan_expires_at: row.plan_expires_at,
    trial_started_at: row.trial_started_at,
    status: planStatus.status,
    daysLeft: planStatus.daysLeft,
    usage: { used, limit },
  })
}
