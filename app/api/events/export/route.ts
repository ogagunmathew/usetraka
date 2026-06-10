import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await pool.query(
      'SELECT * FROM events WHERE user_id = $1 ORDER BY event_date ASC NULLS LAST',
      [user.id]
    )

    const headers = ['Event Name', 'Category', 'Date', 'Day', 'Time', 'Venue', 'Area', 'Organiser', 'Cost', 'Link', 'Description', 'Status']
    const rows = result.rows.map((e) => [
      e.name, e.category, e.event_date ?? '', e.event_day ?? '',
      e.event_time ?? '', e.venue ?? '', e.area ?? '', e.organiser ?? '',
      e.cost ?? '', e.link ?? '', e.description ?? '', e.status,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="lagos-events.csv"',
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
