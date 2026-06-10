import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import pool from '@/lib/db'
import { Resend } from 'resend'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder' })
function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder') }

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const end = new Date(now)
    end.setMonth(end.getMonth() + 3)

    const prompt = `Today's date is ${fmt(now)} (${today}).

Search for professional events in Lagos, Nigeria from today until ${fmt(end)}.
Focus on: tech, startups, investment, fintech, networking, leadership, product, policy, digital transformation.
Target audience: tech leaders, startup founders, investors, digital transformation consultants, fintech professionals.

STRICT RULES — you must follow these exactly:
1. Only include events with a CONFIRMED specific date — day, month, AND year all known. If the exact date is uncertain, skip the event entirely.
2. Only include events happening AFTER today (${today}). Do NOT include past events.
3. Dates MUST be in YYYY-MM-DD format (e.g. ${today}). Any other format is wrong.
4. Return 10–15 events. If fewer confirmed upcoming events exist, return only those.

Return ONLY a valid JSON array (no markdown, no extra text):
[{"name":"","category":"Tech/Startup|Investment|Networking|Leadership|Product/UX|Fintech|Policy|Tech/Policy|Other","date":"YYYY-MM-DD","day":"","time":"","venue":"","area":"","organiser":"","cost":"Free|₦X","link":"","description":""}]`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305' as never, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    let jsonText = ''
    for (const block of response.content) {
      if (block.type === 'text') { jsonText = block.text; break }
    }
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const arrayStart = jsonText.indexOf('[')
    const arrayEnd = jsonText.lastIndexOf(']')
    if (arrayStart === -1 || arrayEnd === -1) throw new Error('No JSON array in Claude response')
    let events
    try {
      events = JSON.parse(jsonText.slice(arrayStart, arrayEnd + 1))
    } catch (parseErr) {
      throw new Error(`JSON parse failed: ${parseErr}`)
    }
    if (!Array.isArray(events)) throw new Error('Claude response was not an array')

    let newCount = 0
    for (const event of events) {
      // Deduplicate by name + date
      const exists = await pool.query(
        'SELECT id FROM events WHERE LOWER(name) = LOWER($1) AND event_date::text ILIKE $2',
        [event.name, `%${event.date}%`]
      )
      if ((exists.rowCount ?? 0) > 0) continue

      await pool.query(
        `INSERT INTO events (name, category, event_date, event_day, event_time, venue, area, organiser, cost, link, description, status, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Interested','ai_search')`,
        [event.name, event.category, event.date || null, event.day, event.time,
         event.venue, event.area, event.organiser, event.cost, event.link, event.description]
      )
      newCount++
    }

    // Get upcoming events (next 14 days)
    const upcoming = await pool.query(
      `SELECT * FROM events WHERE event_date BETWEEN now() AND now() + interval '14 days' ORDER BY event_date ASC`
    )
    const registered = await pool.query(
      `SELECT * FROM events WHERE status = 'Registered' ORDER BY event_date ASC`
    )

    // Send weekly digest email
    if (process.env.RESEND_API_KEY && process.env.REMINDER_EMAIL) {
      const upcomingHtml = upcoming.rows.map((e) =>
        `<li><strong>${e.name}</strong> — ${e.event_date} at ${e.venue}, ${e.area} (${e.cost || 'TBC'}) [${e.status}]</li>`
      ).join('')
      const registeredHtml = registered.rows.map((e) =>
        `<li><strong>${e.name}</strong> — ${e.event_date} | ${e.venue}</li>`
      ).join('')

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'reminders@ashiri.ng',
        to: process.env.REMINDER_EMAIL,
        subject: `📅 Lagos Events Weekly Digest — ${new Date().toDateString()}`,
        html: `<h2>Weekly Lagos Events Digest</h2>
               <p><strong>${newCount} new events</strong> discovered this week.</p>
               <h3>Upcoming (next 14 days)</h3>
               <ul>${upcomingHtml || '<li>None</li>'}</ul>
               <h3>You are Registered For</h3>
               <ul>${registeredHtml || '<li>None</li>'}</ul>`,
      }).catch(console.error)
    }

    return NextResponse.json({ discovered: events.length, added: newCount })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
