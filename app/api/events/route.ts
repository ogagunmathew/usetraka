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

    let query = 'SELECT * FROM events WHERE user_id = $1'
    const params: unknown[] = [user.id]

    if (status) { params.push(status); query += ` AND status = $${params.length}` }
    if (category) { params.push(category); query += ` AND category = $${params.length}` }
    query += ' ORDER BY event_date ASC NULLS LAST, created_at DESC'

    const result = await pool.query(query, params)
    return NextResponse.json({ events: result.rows })
  } catch (err) {
    console.error('GET events error:', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      name, category, event_date, event_day, event_time,
      venue, area, organiser, cost, link, description,
      status = 'Interested', source = 'manual',
    } = body

    const result = await pool.query(
      `INSERT INTO events (user_id, name, category, event_date, event_day, event_time, venue, area, organiser, cost, link, description, status, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [user.id, name, category, event_date || null, event_day, event_time, venue, area, organiser, cost, link, description, status, source]
    )

    const saved = result.rows[0]

    // Auto-schedule a 7-day reminder if the event has a date in the future
    if (saved.event_date) {
      const eventDay = new Date(saved.event_date)
      const now = new Date()
      if (eventDay > now) {
        const remindAt = new Date(eventDay)
        remindAt.setDate(remindAt.getDate() - 7)
        // If less than 7 days away, remind in 1 hour instead
        const finalRemindAt = remindAt > now ? remindAt : new Date(now.getTime() + 60 * 60 * 1000)
        await pool.query(
          'INSERT INTO reminders (user_id, event_id, remind_at) VALUES ($1, $2, $3)',
          [user.id, saved.id, finalRemindAt]
        )
      }
    }

    return NextResponse.json({ event: saved }, { status: 201 })
  } catch (err) {
    console.error('POST events error:', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
