import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await pool.query(
      `SELECT id, title, category, organiser, deadline, funding_amount, country, application_url, source, created_at
       FROM opportunity_pool
       ORDER BY created_at DESC
       LIMIT 200`
    )
    return NextResponse.json({ pool: result.rows })
  } catch {
    return NextResponse.json({ pool: [] })
  }
}
