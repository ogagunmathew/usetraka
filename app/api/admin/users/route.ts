import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

function isAdmin(email: string) {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const search = searchParams.get('search') ?? ''
  const plan   = searchParams.get('plan')   ?? ''
  const status = searchParams.get('status') ?? ''
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (search) {
    conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`)
    params.push(`%${search}%`)
    idx++
  }
  if (plan) {
    conditions.push(`u.plan = $${idx}`)
    params.push(plan); idx++
  }
  if (status === 'active') {
    conditions.push(`(
      (u.plan = 'trial' AND u.trial_started_at + INTERVAL '7 days' > now())
      OR (u.plan != 'trial' AND u.plan_expires_at IS NOT NULL AND u.plan_expires_at > now())
    )`)
  } else if (status === 'expired') {
    conditions.push(`(
      (u.plan = 'trial' AND u.trial_started_at + INTERVAL '7 days' <= now())
      OR (u.plan != 'trial' AND (u.plan_expires_at IS NULL OR u.plan_expires_at <= now()))
    )`)
  } else if (status === 'suspended') {
    conditions.push(`u.status = 'suspended'`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // Try with status column; fall back to a version that defaults status to 'active'
  // if the column doesn't yet exist in the live DB.
  const buildQueries = (withStatus: boolean) => {
    const statusCol = withStatus ? 'u.status' : `'active' AS status`
    // status='suspended' filter only makes sense when the column exists
    const effectiveWhere = (!withStatus && status === 'suspended')
      ? (conditions.length > 1 ? `WHERE ${conditions.slice(0, -1).join(' AND ')}` : '')
      : where
    return {
      rows: `
        SELECT
          u.id, u.name, u.email, u.plan, u.email_verified, ${statusCol},
          u.plan_expires_at, u.trial_started_at, u.created_at,
          COUNT(DISTINCT su.id)::int AS search_count,
          MAX(su.searched_at)        AS last_search_at
        FROM users u
        LEFT JOIN search_usage su ON su.user_id = u.id
        ${effectiveWhere}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `,
      count: `SELECT COUNT(*) FROM users u ${effectiveWhere}`,
    }
  }

  async function runQueries(withStatus: boolean) {
    const q = buildQueries(withStatus)
    const [rows, countRow] = await Promise.all([
      pool.query(q.rows, [...params, limit, offset]),
      pool.query(q.count, params),
    ])
    return { rows, countRow }
  }

  try {
    let result: Awaited<ReturnType<typeof runQueries>>
    try {
      result = await runQueries(true)
    } catch {
      result = await runQueries(false)
    }
    const { rows, countRow } = result
    return NextResponse.json({
      users: rows.rows,
      pagination: {
        page, limit,
        total: parseInt(countRow.rows[0].count),
        totalPages: Math.ceil(parseInt(countRow.rows[0].count) / limit),
      },
    })
  } catch (err) {
    console.error('Admin users error:', err)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
