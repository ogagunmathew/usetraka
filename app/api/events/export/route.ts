import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM events ORDER BY event_date ASC NULLS LAST'
    )

    const headers = [
      'Event Name', 'Category', 'Date', 'Day', 'Time',
      'Venue', 'Area', 'Organiser', 'Cost', 'Link', 'Description', 'Status',
    ]

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
