import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import pool from '@/lib/db'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder') }

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const normalizedEmail = email.trim().toLowerCase()
  const user = await pool.query(
    'SELECT id, name, email_verified FROM users WHERE email = $1',
    [normalizedEmail]
  )

  if ((user.rowCount ?? 0) === 0) {
    return NextResponse.json({ ok: true })
  }

  const { id, name, email_verified } = user.rows[0]
  if (email_verified) {
    return NextResponse.json({ error: 'This email is already verified' }, { status: 400 })
  }

  await pool.query('DELETE FROM verification_tokens WHERE user_id = $1', [id])

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await pool.query(
    'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [id, token, expiresAt]
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`

  try {
    const resend = getResend()
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: normalizedEmail,
      subject: 'Verify your Eventraka account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#4f8ef7;margin:0 0 8px">Verify your Eventraka account</h2>
          <p style="color:#666;margin:0 0 24px">Hi ${name}, click the button below to verify your email address.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#4f8ef7;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            Verify my email
          </a>
          <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 24 hours.</p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr)
  }

  return NextResponse.json({ ok: true })
}
