import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const result = await pool.query(
    `SELECT vt.user_id, vt.expires_at, u.email, u.name
     FROM verification_tokens vt
     JOIN users u ON u.id = vt.user_id
     WHERE vt.token = $1`,
    [token]
  )

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.redirect(new URL('/verify?error=invalid', req.url))
  }

  const row = result.rows[0]

  if (new Date(row.expires_at) < new Date()) {
    const url = new URL('/verify', req.url)
    url.searchParams.set('error', 'expired')
    url.searchParams.set('email', row.email)
    return NextResponse.redirect(url)
  }

  await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [row.user_id])
  await pool.query('DELETE FROM verification_tokens WHERE token = $1', [token])

  const jwtToken = await signToken({ id: row.user_id, email: row.email, name: row.name })
  const isProd = process.env.NODE_ENV === 'production'

  const response = NextResponse.redirect(new URL('/app', req.url))
  response.cookies.set('session', jwtToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
