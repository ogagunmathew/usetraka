import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { signToken, SessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const result = await pool.query(
    'SELECT id, email, name, password_hash, email_verified, status FROM users WHERE email = $1',
    [normalizedEmail]
  )

  const user = result.rows[0]
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (user.status === 'suspended') {
    return NextResponse.json(
      { error: 'Your account has been suspended. Contact support at hello@usetraka.com.' },
      { status: 403 }
    )
  }

  if (!user.email_verified) {
    return NextResponse.json(
      { error: 'Please verify your email before signing in.', requiresVerification: true, email: normalizedEmail },
      { status: 403 }
    )
  }

  const sessionUser: SessionUser = { id: user.id, email: user.email, name: user.name }
  const token = await signToken(sessionUser)

  const res = NextResponse.json({ ok: true, user: sessionUser })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
