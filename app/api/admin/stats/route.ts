import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return admins.includes(email.toLowerCase())
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [overview, planBreakdown, searchStats, recentSignups] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                                                           AS total_users,
          COUNT(*) FILTER (WHERE email_verified = true)                                     AS verified,
          COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')                  AS new_this_week,
          COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days')                 AS new_this_month,
          COUNT(*) FILTER (
            WHERE plan = 'trial'
              AND trial_started_at + INTERVAL '7 days' > now()
          )                                                                                  AS active_trials,
          COUNT(*) FILTER (
            WHERE plan != 'trial'
              AND plan_expires_at IS NOT NULL
              AND plan_expires_at > now()
          )                                                                                  AS active_paid,
          COUNT(*) FILTER (
            WHERE (plan = 'trial' AND trial_started_at + INTERVAL '7 days' <= now())
               OR (plan != 'trial' AND (plan_expires_at IS NULL OR plan_expires_at <= now()))
          )                                                                                  AS expired
        FROM users
      `),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE plan = 'starter' AND plan_expires_at > now())  AS starter,
          COUNT(*) FILTER (WHERE plan = 'growth'  AND plan_expires_at > now())  AS growth,
          COUNT(*) FILTER (WHERE plan = 'annual'  AND plan_expires_at > now())  AS annual,
          -- revenue: sum of plan prices for active paid subscriptions (in kobo)
          (
            COUNT(*) FILTER (WHERE plan = 'starter' AND plan_expires_at > now()) * 450000 +
            COUNT(*) FILTER (WHERE plan = 'growth'  AND plan_expires_at > now()) * 780000 +
            COUNT(*) FILTER (WHERE plan = 'annual'  AND plan_expires_at > now()) * 1320000
          )                                                                        AS revenue_kobo
        FROM users
      `),

      pool.query(`
        SELECT
          COUNT(*)                                                             AS total_searches,
          COUNT(*) FILTER (WHERE searched_at >= now() - INTERVAL '7 days')   AS searches_this_week,
          COUNT(*) FILTER (WHERE searched_at >= now() - INTERVAL '30 days')  AS searches_this_month
        FROM search_usage
      `),

      pool.query(`
        SELECT
          u.id, u.name, u.email, u.plan, u.email_verified,
          u.plan_expires_at, u.trial_started_at, u.created_at,
          COUNT(su.id)::int AS search_count
        FROM users u
        LEFT JOIN search_usage su ON su.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 50
      `),
    ])

    const o = overview.rows[0]
    const p = planBreakdown.rows[0]
    const s = searchStats.rows[0]

    return NextResponse.json({
      overview: {
        totalUsers:      parseInt(o.total_users),
        verified:        parseInt(o.verified),
        newThisWeek:     parseInt(o.new_this_week),
        newThisMonth:    parseInt(o.new_this_month),
        activeTrials:    parseInt(o.active_trials),
        activePaid:      parseInt(o.active_paid),
        expired:         parseInt(o.expired),
      },
      plans: {
        starter:      parseInt(p.starter),
        growth:       parseInt(p.growth),
        annual:       parseInt(p.annual),
        revenueKobo:  parseInt(p.revenue_kobo),
      },
      searches: {
        total:       parseInt(s.total_searches),
        thisWeek:    parseInt(s.searches_this_week),
        thisMonth:   parseInt(s.searches_this_month),
      },
      users: recentSignups.rows,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
