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
    end.setMonth(end.getMonth() + 6)

    const prompt = `Today is ${fmt(now)} (${today}). You are building an intelligence feed for Nigerian professionals, founders, and students.

Search the web for REAL, currently open opportunities that Nigerians are eligible for. Cover all five categories in roughly equal proportions:
- Grant (research grants, project funding, government grants, diaspora grants)
- Scholarship (postgraduate, undergraduate, professional development, MBA, short courses)
- Incubator (cohort-based programmes with workspace, mentorship, seed funding)
- Accelerator (equity/grant-funded startup programmes, demo day tracks)
- Tender (public procurement notices from Nigeria, AfDB, UN, World Bank, AU, ECOWAS)

Deadline window: open/rolling OR closing between ${today} and ${fmt(end)}.

SOURCES — search these specifically:
Grants: Ford Foundation, MacArthur Foundation, Gates Foundation, USAID Development Grants, EU Africa Fund, AfDB Grants Window, Tony Elumelu Foundation, Dangote Foundation, NITDA, Bank of Industry, FIRS grants, African Women Development Fund
Scholarships: Chevening (UK), Fulbright (US), MasterCard Foundation Scholars, DAAD (Germany), Commonwealth Scholarships, Aga Khan Foundation, MEXT Japan, Chinese Government Scholarship, OFID Scholarship, Inlaks Foundation, MTN Foundation Scholarships, Rhodes Scholarship
Incubators: CcHUB, Ventures Platform, Seedstars Nigeria, GreenHouse Capital, ARM Labs, Flat6Labs, Startupbootcamp Africa, Google for Startups Africa, Microsoft for Startups
Accelerators: Y Combinator, Techstars Africa, 500 Startups, MEST Africa, ALX Venture, Catalyst Fund, Founders Factory Africa, Village Capital, Norrsken22
Tenders: BPP Nigeria (publicprocurement.ng), UN Global Marketplace (ungm.org), World Bank tenders, AfDB tenders, Nigerian Federal Government tenders, ECOWAS procurement, AU Commission tenders

STRICT RULES:
1. Every entry must have a working application_url — skip if no verifiable link.
2. Nigerians must be explicitly eligible or "open to African/global applicants" confirmed.
3. Deadline must be after ${today} or explicitly rolling/open — no expired opportunities.
4. funding_amount: be specific e.g. "USD 50,000", "£10,000 stipend + tuition", "Equity-free seed", "N/A (in-kind support)".
5. eligibility: 1–2 sentences on who qualifies (nationality, stage, sector, degree level etc).
6. description: 2–3 sentences on what the opportunity is and what's provided.
7. country: where the organiser is based or where funding originates (not "Nigeria" unless it's a Nigerian programme).
8. Aim for 15–20 diverse, high-quality results. Favour less well-known opportunities over ones every Nigerian already knows.

Return ONLY a valid JSON array, no markdown fences, no commentary:
[
  {
    "title": "Full official name of the opportunity",
    "category": "Grant|Scholarship|Incubator|Accelerator|Tender",
    "organiser": "Organisation name",
    "deadline": "YYYY-MM-DD or null if rolling",
    "funding_amount": "Specific amount or in-kind description",
    "eligibility": "Who qualifies — nationality, stage, sector",
    "description": "What it is and what it provides",
    "application_url": "Direct URL to application page",
    "country": "Country of organiser or funding origin"
  }
]`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
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

    let opps
    try {
      opps = JSON.parse(jsonText.slice(arrayStart, arrayEnd + 1))
    } catch (parseErr) {
      throw new Error(`JSON parse failed: ${parseErr}`)
    }
    if (!Array.isArray(opps)) throw new Error('Response was not an array')

    let newCount = 0
    for (const opp of opps) {
      if (!opp.title || !opp.category) continue
      // Deduplicate by title + deadline
      const exists = await pool.query(
        'SELECT id FROM opportunity_pool WHERE lower(title) = lower($1) AND (deadline = $2 OR (deadline IS NULL AND $2 IS NULL))',
        [opp.title, opp.deadline || null]
      )
      if ((exists.rowCount ?? 0) > 0) continue

      await pool.query(
        `INSERT INTO opportunity_pool (title, category, organiser, deadline, funding_amount, eligibility, description, application_url, country)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [opp.title, opp.category, opp.organiser || null, opp.deadline || null,
         opp.funding_amount || null, opp.eligibility || null, opp.description || null,
         opp.application_url || null, opp.country || null]
      )
      newCount++
    }

    // Send weekly digest email
    if (process.env.RESEND_API_KEY && process.env.REMINDER_EMAIL) {
      const closing = await pool.query(
        `SELECT * FROM opportunity_pool WHERE deadline IS NOT NULL AND deadline <= now() + interval '30 days' ORDER BY deadline ASC LIMIT 10`
      )
      const closingHtml = closing.rows.map((o) =>
        `<li><strong>${o.title}</strong> (${o.category}) — deadline ${o.deadline} | ${o.organiser || 'Unknown org'} | ${o.funding_amount || 'See link'}</li>`
      ).join('')

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'reminders@usetraka.com',
        to: process.env.REMINDER_EMAIL,
        subject: `🌍 Traka Weekly Opportunities Digest — ${new Date().toDateString()}`,
        html: `<h2>Weekly Opportunities Digest — Traka</h2>
               <p><strong>${newCount} new opportunities</strong> discovered this week.</p>
               <h3>Closing Soon (next 30 days)</h3>
               <ul>${closingHtml || '<li>None closing soon</li>'}</ul>`,
      }).catch(console.error)
    }

    return NextResponse.json({ discovered: opps.length, added: newCount })
  } catch (err) {
    console.error('Discover opportunities cron error:', err)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
