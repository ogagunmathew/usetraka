import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import pool from '@/lib/db'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder') }

export async function POST(req: NextRequest) {
  try {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
    [name.trim(), normalizedEmail, password_hash]
  )

  const user = result.rows[0]
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await pool.query(
    'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`

  try {
    const resend = getResend()
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: normalizedEmail,
      subject: 'Verify your Traka account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#4f8ef7;margin:0 0 8px">Welcome to Traka, ${name.trim()}!</h2>
          <p style="color:#666;margin:0 0 24px">You're one step away. Verify your email to start discovering professional events across Nigeria.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#4f8ef7;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            Verify my email
          </a>
          <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr)
  }

  return NextResponse.json({ ok: true, requiresVerification: true })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 })
  }
}
