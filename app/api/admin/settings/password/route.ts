import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new password are required.' }, { status: 400 })
  }

  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user.id])
  if (!result.rows.length) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })

  const hash = await bcrypt.hash(newPassword, 12)
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id])
  return NextResponse.json({ ok: true })
}
