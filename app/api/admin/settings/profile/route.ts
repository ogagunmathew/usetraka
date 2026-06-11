import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser, signToken, SessionUser } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })

  const normalizedEmail = email.trim().toLowerCase()

  // Check if email is taken by another user
  const conflict = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [normalizedEmail, user.id])
  if (conflict.rows.length) return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 })

  await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name.trim(), normalizedEmail, user.id])

  // Re-issue session token with updated name/email
  const sessionUser: SessionUser = { id: user.id, email: normalizedEmail, name: name.trim() }
  const token = await signToken(sessionUser)
  const res = NextResponse.json({ ok: true, user: sessionUser })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('session', token, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return res
}
