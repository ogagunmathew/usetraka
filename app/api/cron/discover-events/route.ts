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

    // Remove pool events that are more than 7 days in the past
    await pool.query(
      `DELETE FROM event_pool WHERE event_date < CURRENT_DATE - interval '7 days'`
    )

    const prompt = `Today's date is ${fmt(now)} (${today}).

Search for professional events across Nigeria's major cities from today until ${fmt(end)}.

Cities to cover: Lagos, Abuja, Port Harcourt, Kano, Abeokuta, Ilorin.
Categories to use (pick the best fit for each event): Tech, Fintech, Creative, Tech Expo, Investments, Other.
Focus: tech leaders, startup founders, investors, digital transformation consultants, fintech professionals.

STRICT RULES — follow exactly:
1. Only include events with a CONFIRMED specific date — day, month, AND year all known. Skip uncertain dates entirely.
2. Only include events happening AFTER today (${today}). No past events.
3. Dates MUST be in YYYY-MM-DD format (e.g. ${today}).
4. Include the city for every event — must be one of: Lagos, Abuja, Port Harcourt, Kano, Abeokuta, Ilorin.
5. Aim for 15–25 events spread across cities where possible.

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "name": "Event Name",
    "category": "Tech|Fintech|Creative|Tech Expo|Investments|Other",
    "city": "Lagos",
    "date": "YYYY-MM-DD",
    "day": "Monday",
    "time": "09:00 AM",
    "venue": "Venue Name",
    "area": "Victoria Island",
    "organiser": "Organiser Name",
    "cost": "Free | ₦15,000",
    "link": "https://...",
    "description": "1-2 sentence summary of what the event is about and who should attend."
  }
]`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6144,
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

    // Filter out past events
    const futureEvents = events.filter((e) => e.date && e.date >= today)

    let newCount = 0
    for (const event of futureEvents) {
      if (!event.name || !event.date) continue

      // Deduplicate by name + date
      const exists = await pool.query(
        'SELECT id FROM event_pool WHERE lower(name) = lower($1) AND event_date = $2::date',
        [event.name, event.date]
      )
      if ((exists.rowCount ?? 0) > 0) continue

      await pool.query(
        `INSERT INTO event_pool (name, category, city, event_date, event_day, event_time, venue, area, organiser, cost, link, description)
         VALUES ($1,$2,$3,$4::date,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          event.name,
          event.category || 'Other',
          event.city || 'Lagos',
          event.date,
          event.day || null,
          event.time || null,
          event.venue || null,
          event.area || null,
          event.organiser || null,
          event.cost || null,
          event.link || null,
          event.description || null,
        ]
      )
      newCount++
    }

    // Weekly digest email
    if (process.env.RESEND_API_KEY && process.env.REMINDER_EMAIL) {
      const upcoming = await pool.query(
        `SELECT * FROM event_pool
         WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '14 days'
         ORDER BY event_date ASC`
      )
      const upcomingHtml = upcoming.rows.map((e) =>
        `<li><strong>${e.name}</strong> — ${e.event_date} | ${e.city} | ${e.venue || 'Venue TBC'} (${e.cost || 'TBC'})</li>`
      ).join('')

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'reminders@usetraka.com',
        to: process.env.REMINDER_EMAIL,
        subject: `📅 Traka Weekly Events Digest — ${new Date().toDateString()}`,
        html: `<h2>Weekly Events Digest — Traka</h2>
               <p><strong>${newCount} new events</strong> added to the discovery pool.</p>
               <h3>Upcoming in the next 14 days</h3>
               <ul>${upcomingHtml || '<li>None</li>'}</ul>`,
      }).catch(console.error)
    }

    return NextResponse.json({ discovered: futureEvents.length, added: newCount })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
