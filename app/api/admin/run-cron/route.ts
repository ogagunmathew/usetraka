import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { type } = await req.json()
  if (type !== 'events' && type !== 'opportunities') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`

  const res = await fetch(`${base}/api/cron/discover-${type}`, {
    headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
