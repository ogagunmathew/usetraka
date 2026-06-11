import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'
import { Resend } from 'resend'

function isAdmin(email: string) {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder') }

function buildSuspensionEmail(userName: string, suspended: boolean): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://usetraka.com'
  const subject = suspended ? 'Your Traka account has been suspended' : 'Your Traka account has been reinstated'

  if (suspended) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4fd;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px 48px;">
    <div style="background:#080c18;border-radius:14px 14px 0 0;padding:24px 32px;text-align:center;">
      <p style="margin:0;font-size:20px;font-weight:900;color:#4f8ef7;letter-spacing:-0.03em;">Traka</p>
    </div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:32px;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0f172a;">Account suspended</p>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">Hi ${userName}, your Traka account has been suspended. You will not be able to sign in until this is resolved.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">If you believe this is an error or would like to appeal, please reply to this email or contact us directly at <a href="mailto:hello@usetraka.com" style="color:#4f8ef7;">hello@usetraka.com</a>.</p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">— The Traka Team</p>
    </div>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#94a3b8;"><a href="${APP_URL}" style="color:#94a3b8;">usetraka.com</a></p>
  </div>
</body>
</html>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4fd;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px 48px;">
    <div style="background:#080c18;border-radius:14px 14px 0 0;padding:24px 32px;text-align:center;">
      <p style="margin:0;font-size:20px;font-weight:900;color:#4f8ef7;letter-spacing:-0.03em;">Traka</p>
    </div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:32px;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0f172a;">Account reinstated ✓</p>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">Hi ${userName}, your Traka account has been reinstated and you can sign in again.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/login" style="display:inline-block;padding:12px 28px;background:#4f8ef7;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Sign in to Traka</a>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;">— The Traka Team</p>
    </div>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#94a3b8;"><a href="${APP_URL}" style="color:#94a3b8;">usetraka.com</a></p>
  </div>
</body>
</html>`
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const allowed = ['status', 'plan', 'plan_expires_at']
  const sets: string[] = []
  const vals: unknown[] = []
  let idx = 1

  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = $${idx}`)
      vals.push(body[key])
      idx++
    }
  }

  if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  vals.push(id)
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals)

  // Send suspension/reinstatement email when status changes
  if ('status' in body && (body.status === 'suspended' || body.status === 'active')) {
    try {
      const target = await pool.query('SELECT name, email FROM users WHERE id = $1', [id])
      if (target.rows.length > 0) {
        const { name, email } = target.rows[0]
        const suspended = body.status === 'suspended'
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@usetraka.com',
          to: email,
          subject: suspended ? 'Your Traka account has been suspended' : 'Your Traka account has been reinstated',
          html: buildSuspensionEmail(name, suspended),
        })
      }
    } catch (emailErr) {
      console.error('Suspension email failed:', emailErr)
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({ ok: true })
}
