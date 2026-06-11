import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let query = 'SELECT * FROM opportunities WHERE user_id = $1'
    const params: unknown[] = [user.id]

    if (status) { params.push(status); query += ` AND status = $${params.length}` }
    if (category) { params.push(category); query += ` AND category = $${params.length}` }
    query += ' ORDER BY deadline ASC NULLS LAST, created_at DESC'

    const result = await pool.query(query, params)
    return NextResponse.json({ opportunities: result.rows })
  } catch (err) {
    console.error('GET opportunities error:', err)
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      title, category, organiser, deadline, funding_amount,
      eligibility, description, application_url, country,
      status = 'Saved', source = 'manual',
    } = body

    const result = await pool.query(
      `INSERT INTO opportunities
         (user_id, title, category, organiser, deadline, funding_amount, eligibility, description, application_url, country, status, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [user.id, title, category, organiser || null, deadline || null, funding_amount || null,
       eligibility || null, description || null, application_url || null, country || null, status, source]
    )

    const saved = result.rows[0]

    // Auto-schedule a 7-day reminder if there's a future deadline
    if (saved.deadline) {
      const deadlineDay = new Date(saved.deadline)
      const now = new Date()
      if (deadlineDay > now) {
        const remindAt = new Date(deadlineDay)
        remindAt.setDate(remindAt.getDate() - 7)
        const finalRemindAt = remindAt > now ? remindAt : new Date(now.getTime() + 60 * 60 * 1000)
        await pool.query(
          'INSERT INTO opportunity_reminders (user_id, opp_id, remind_at) VALUES ($1, $2, $3)',
          [user.id, saved.id, finalRemindAt]
        )
      }
    }

    return NextResponse.json({ opportunity: saved }, { status: 201 })
  } catch (err) {
    console.error('POST opportunities error:', err)
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 })
  }
}
