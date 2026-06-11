import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder') }

function buildReminderEmail(params: {
  userName: string
  eventName: string
  eventDate: string
  eventTime: string | null
  venue: string | null
  area: string | null
  city: string | null
  cost: string | null
  link: string | null
  description: string | null
  daysUntil: number
}) {
  const { userName, eventName, eventDate, eventTime, venue, area, city, cost, link, description, daysUntil } = params
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://usetraka.com'

  const dateStr = new Date(eventDate).toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const urgencyLabel = daysUntil <= 1 ? 'Tomorrow' : daysUntil <= 3 ? `In ${daysUntil} days` : `7-day heads-up`
  const locationLine = [venue, area, city].filter(Boolean).join(', ') || 'Venue TBC'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Event Reminder — Traka</title>
</head>
<body style="margin:0;padding:0;background:#f0f4fd;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px 48px;">

    <!-- Header -->
    <div style="background:#080c18;border-radius:14px 14px 0 0;padding:28px 36px;text-align:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:400px;height:200px;background:radial-gradient(ellipse,rgba(79,142,247,0.25) 0%,transparent 65%);pointer-events:none;"></div>
      <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#4f8ef7;letter-spacing:-0.03em;position:relative;">Traka</p>
      <p style="margin:0;font-size:11px;font-weight:700;color:#3d5280;letter-spacing:0.12em;text-transform:uppercase;position:relative;">Nigeria Event Intelligence</p>
    </div>

    <!-- Urgency band -->
    <div style="background:#4f8ef7;padding:10px 36px;text-align:center;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#fff;letter-spacing:0.04em;text-transform:uppercase;">${urgencyLabel}</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:36px;border:1px solid #dde6f7;border-top:none;">
      <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
        Hi <strong>${userName.split(' ')[0]}</strong>,
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
        You saved an event to your Traka tracker. Here&apos;s your reminder:
      </p>

      <!-- Event card -->
      <div style="border:1px solid #dde6f7;border-radius:12px;overflow:hidden;margin-bottom:28px;">
        <div style="height:4px;background:linear-gradient(90deg,#4f8ef7,#7cb5ff);"></div>
        <div style="padding:24px 28px;">
          <h2 style="margin:0 0 16px;font-size:19px;font-weight:800;color:#111827;letter-spacing:-0.02em;line-height:1.3;">${eventName}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#9ca3af;width:20px;vertical-align:top;">📅</td>
              <td style="padding:5px 0;font-size:13px;color:#374151;"><strong>${dateStr}</strong>${eventTime ? `<br><span style="color:#9ca3af;">${eventTime}</span>` : ''}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#9ca3af;vertical-align:top;">📍</td>
              <td style="padding:5px 0;font-size:13px;color:#374151;">${locationLine}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#9ca3af;vertical-align:top;">💰</td>
              <td style="padding:5px 0;font-size:13px;color:#374151;">${cost || 'Cost TBC'}</td>
            </tr>
          </table>
        </div>
      </div>

      ${description ? `<p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.75;padding:16px;background:#f9fafb;border-radius:8px;border-left:3px solid #4f8ef7;">${description}</p>` : ''}

      ${link
        ? `<a href="${link}" style="display:block;text-align:center;background:#4f8ef7;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.01em;margin-bottom:16px;">View &amp; Register →</a>`
        : ''}

      <a href="${APP_URL}/app" style="display:block;text-align:center;background:#f0f4fd;color:#4f8ef7;text-decoration:none;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:600;border:1px solid #dde6f7;">
        Open Traka Tracker
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f0f4fd;border:1px solid #dde6f7;border-top:none;border-radius:0 0 14px 14px;padding:20px 36px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
        You&apos;re receiving this because you saved this event on
        <a href="${APP_URL}" style="color:#4f8ef7;text-decoration:none;">Traka</a>.<br>
        <a href="${APP_URL}/app" style="color:#9ca3af;text-decoration:underline;">Manage your reminders</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const due = await pool.query(
      `SELECT
         r.id          AS reminder_id,
         r.remind_at,
         e.name,
         e.event_date,
         e.event_time,
         e.venue,
         e.area,
         e.city,
         e.cost,
         e.link,
         e.description,
         u.email       AS user_email,
         u.name        AS user_name
       FROM reminders r
       JOIN events e ON e.id  = r.event_id
       JOIN users  u ON u.id  = r.user_id
       WHERE r.sent = false
         AND r.remind_at <= now()
         AND e.event_date >= CURRENT_DATE
       ORDER BY r.remind_at ASC`
    )

    if ((due.rowCount ?? 0) === 0) return NextResponse.json({ sent: 0, message: 'No reminders due' })

    const resend = getResend()
    let sent = 0
    const errors: string[] = []

    for (const row of due.rows) {
      const daysUntil = Math.ceil(
        (new Date(row.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'reminders@usetraka.com',
          to: row.user_email,
          subject: `Traka Reminder: "${row.name}" is ${daysUntil <= 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
          html: buildReminderEmail({
            userName: row.user_name,
            eventName: row.name,
            eventDate: row.event_date,
            eventTime: row.event_time,
            venue: row.venue,
            area: row.area,
            city: row.city,
            cost: row.cost,
            link: row.link,
            description: row.description,
            daysUntil,
          }),
        })
        await pool.query('UPDATE reminders SET sent = true WHERE id = $1', [row.reminder_id])
        sent++
      } catch (emailErr) {
        const msg = `reminder ${row.reminder_id} → ${row.user_email}: ${emailErr}`
        console.error(msg)
        errors.push(msg)
      }
    }

    return NextResponse.json({ sent, total: due.rowCount, errors: errors.length ? errors : undefined })
  } catch (err) {
    console.error('send-reminders cron error:', err)
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
  }
}
