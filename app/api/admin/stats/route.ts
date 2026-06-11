import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

function isAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return admins.includes(email.toLowerCase())
}

const DEFAULT_OPP_STATS = {
  totalSaved: 0, savedThisWeek: 0, applied: 0, awarded: 0, poolSize: 0,
  byCategory: { Grant: 0, Scholarship: 0, Incubator: 0, Accelerator: 0, Tender: 0 },
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Core queries — always available
    const [overview, planBreakdown, searchStats, signupsByDay] = await Promise.all([
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
          )                                                                                  AS expired,
          COUNT(*) FILTER (
            WHERE plan = 'trial'
              AND trial_started_at + INTERVAL '7 days' > now()
              AND trial_started_at + INTERVAL '7 days' <= now() + INTERVAL '48 hours'
          )                                                                                  AS expiring_trials
        FROM users
      `),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE plan = 'starter' AND plan_expires_at > now())  AS starter,
          COUNT(*) FILTER (WHERE plan = 'growth'  AND plan_expires_at > now())  AS growth,
          COUNT(*) FILTER (WHERE plan = 'annual'  AND plan_expires_at > now())  AS annual,
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
        SELECT DATE(created_at) AS day, COUNT(*)::int AS count
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY 1
        ORDER BY 1
      `),
    ])

    // Users query — try with opp_count + last_search_at, fall back if table absent
    let usersRows: unknown[]
    try {
      const result = await pool.query(`
        SELECT
          u.id, u.name, u.email, u.plan, u.email_verified,
          u.plan_expires_at, u.trial_started_at, u.created_at,
          COUNT(DISTINCT su.id)::int  AS search_count,
          MAX(su.searched_at)         AS last_search_at,
          COUNT(DISTINCT o.id)::int   AS opp_count
        FROM users u
        LEFT JOIN search_usage su ON su.user_id = u.id
        LEFT JOIN opportunities o ON o.user_id  = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 50
      `)
      usersRows = result.rows
    } catch {
      const result = await pool.query(`
        SELECT
          u.id, u.name, u.email, u.plan, u.email_verified,
          u.plan_expires_at, u.trial_started_at, u.created_at,
          COUNT(su.id)::int  AS search_count,
          MAX(su.searched_at) AS last_search_at,
          0::int              AS opp_count
        FROM users u
        LEFT JOIN search_usage su ON su.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 50
      `)
      usersRows = result.rows
    }

    // Opportunity stats — optional, zeros if tables don't exist yet
    let opportunities = DEFAULT_OPP_STATS
    try {
      const oppStats = await pool.query(`
        SELECT
          COUNT(*)                                                               AS total_saved,
          COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')      AS saved_this_week,
          COUNT(*) FILTER (WHERE status = 'Applied')                            AS applied,
          COUNT(*) FILTER (WHERE status = 'Awarded')                            AS awarded,
          COUNT(*) FILTER (WHERE category = 'Grant')                            AS grants,
          COUNT(*) FILTER (WHERE category = 'Scholarship')                      AS scholarships,
          COUNT(*) FILTER (WHERE category = 'Incubator')                        AS incubators,
          COUNT(*) FILTER (WHERE category = 'Accelerator')                      AS accelerators,
          COUNT(*) FILTER (WHERE category = 'Tender')                           AS tenders,
          (SELECT COUNT(*) FROM opportunity_pool)                               AS pool_size
        FROM opportunities
      `)
      const op = oppStats.rows[0]
      opportunities = {
        totalSaved:    parseInt(op.total_saved),
        savedThisWeek: parseInt(op.saved_this_week),
        applied:       parseInt(op.applied),
        awarded:       parseInt(op.awarded),
        poolSize:      parseInt(op.pool_size),
        byCategory: {
          Grant:       parseInt(op.grants),
          Scholarship: parseInt(op.scholarships),
          Incubator:   parseInt(op.incubators),
          Accelerator: parseInt(op.accelerators),
          Tender:      parseInt(op.tenders),
        },
      }
    } catch {
      // opportunity tables not migrated yet — return defaults
    }

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
        expiringTrials:  parseInt(o.expiring_trials),
      },
      plans: {
        starter:     parseInt(p.starter),
        growth:      parseInt(p.growth),
        annual:      parseInt(p.annual),
        revenueKobo: parseInt(p.revenue_kobo),
      },
      searches: {
        total:     parseInt(s.total_searches),
        thisWeek:  parseInt(s.searches_this_week),
        thisMonth: parseInt(s.searches_this_month),
      },
      signupsByDay: signupsByDay.rows.map(r => ({
        day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
        count: r.count,
      })),
      opportunities,
      users: usersRows,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
