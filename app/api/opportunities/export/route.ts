import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await pool.query(
      'SELECT * FROM opportunities WHERE user_id = $1 ORDER BY deadline ASC NULLS LAST',
      [user.id]
    )

    const headers = ['Title', 'Category', 'Organiser', 'Deadline', 'Funding', 'Eligibility', 'Country', 'Application URL', 'Description', 'Status']
    const rows = result.rows.map((o) => [
      o.title, o.category, o.organiser ?? '', o.deadline ?? '',
      o.funding_amount ?? '', o.eligibility ?? '', o.country ?? '',
      o.application_url ?? '', o.description ?? '', o.status,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="traka-opportunities.csv"',
      },
    })
  } catch (err) {
    console.error('Opportunity export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
