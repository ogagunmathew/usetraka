import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let query = 'SELECT * FROM events WHERE 1=1'
    const params: string[] = []

    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }
    if (category) {
      params.push(category)
      query += ` AND category = $${params.length}`
    }
    query += ' ORDER BY event_date ASC NULLS LAST, created_at DESC'

    const result = await pool.query(query, params)
    return NextResponse.json({ events: result.rows })
  } catch (err) {
    console.error('GET events error:', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, category, event_date, event_day, event_time,
      venue, area, organiser, cost, link, description,
      status = 'Interested', source = 'manual',
    } = body

    const result = await pool.query(
      `INSERT INTO events (name, category, event_date, event_day, event_time, venue, area, organiser, cost, link, description, status, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [name, category, event_date || null, event_day, event_time, venue, area, organiser, cost, link, description, status, source]
    )
    return NextResponse.json({ event: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('POST events error:', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
