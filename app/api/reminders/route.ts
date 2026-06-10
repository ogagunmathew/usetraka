import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { Resend } from 'resend'
import { getUser } from '@/lib/auth'

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder') }

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await pool.query(
      `SELECT r.*, e.name as event_name, e.event_date, e.venue, e.area, e.cost, e.link
       FROM reminders r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = $1
       ORDER BY r.remind_at ASC`,
      [user.id]
    )
    return NextResponse.json({ reminders: result.rows })
  } catch (err) {
    console.error('GET reminders error:', err)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { event_id } = await req.json()

    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND user_id = $2',
      [event_id, user.id]
    )
    if (eventResult.rowCount === 0) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    const event = eventResult.rows[0]

    if (!event.event_date) return NextResponse.json({ error: 'Event has no date set' }, { status: 400 })

    const remindAt = new Date(event.event_date)
    remindAt.setDate(remindAt.getDate() - 7)

    const existing = await pool.query('SELECT id FROM reminders WHERE event_id = $1 AND user_id = $2', [event_id, user.id])
    if ((existing.rowCount ?? 0) > 0) return NextResponse.json({ error: 'Reminder already exists for this event' }, { status: 409 })

    const result = await pool.query(
      `INSERT INTO reminders (user_id, event_id, remind_at, channel) VALUES ($1, $2, $3, 'email') RETURNING *`,
      [user.id, event_id, remindAt.toISOString()]
    )

    if (process.env.RESEND_API_KEY) {
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'reminders@ashiri.ng',
        to: user.email,
        subject: `✅ Reminder set: ${event.name}`,
        html: `<p>Hi ${user.name},</p>
               <p>You'll receive a reminder on <strong>${remindAt.toDateString()}</strong> (7 days before) for:</p>
               <h2>${event.name}</h2>
               <p>📅 ${event.event_date} | 📍 ${event.venue ?? ''}, ${event.area ?? ''}</p>
               <p>💰 ${event.cost || 'TBC'}</p>
               ${event.link ? `<p><a href="${event.link}">Register here</a></p>` : ''}`,
      }).catch(console.error)
    }

    return NextResponse.json({ reminder: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('POST reminder error:', err)
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}
