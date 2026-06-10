import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SearchFilters } from '@/lib/types'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'
import { TRIAL_SEARCHES, PAID_SEARCHES_PER_MONTH, getPlanStatus } from '@/lib/plans'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CACHE_TTL_MINUTES = 60

function buildCacheKey(filters: SearchFilters): string {
  const cats = [...(filters.categories || [])].sort().join(',')
  const cities = [...(filters.cities || [])].sort().join(',')
  const { timeframe = '', budget = '', keywords = '' } = filters
  return [cats, cities, timeframe, budget, keywords.trim().toLowerCase()].join('|')
}

function buildPrompt(filters: SearchFilters): string {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const end = new Date(now)
  switch (filters.timeframe) {
    case 'thismonth':  end.setMonth(end.getMonth() + 1, 0); break
    case 'nextmonth':  end.setMonth(end.getMonth() + 2, 0); break
    case '6months':    end.setMonth(end.getMonth() + 6);    break
    default:           end.setMonth(end.getMonth() + 3);    break
  }

  const allCategories = ['Tech', 'Fintech', 'Creative', 'Tech Expo', 'Investments']
  const selectedCats = filters.categories?.length ? filters.categories : allCategories
  const allCities = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Abeokuta', 'Ilorin']
  const selectedCities = filters.cities?.length ? filters.cities : allCities

  const catLine = selectedCats.length === allCategories.length
    ? 'all categories (Tech, Fintech, Creative, Tech Expo, Investments)'
    : selectedCats.join(', ')

  const cityLine = selectedCities.length === allCities.length
    ? 'all major cities (Lagos, Abuja, Port Harcourt, Kano, Abeokuta, Ilorin)'
    : selectedCities.join(', ')

  const budget = filters.budget === 'free' ? 'free events only' : filters.budget === '25k' ? 'events under ₦25,000' : 'any budget'
  const keywords = filters.keywords ? `Additional focus: ${filters.keywords}.` : ''

  return `Today's date is ${fmt(now)} (${today}).

Search for professional events in Nigeria from today until ${fmt(end)}.
Categories: ${catLine}.
Cities: ${cityLine}.
Budget: ${budget}. ${keywords}
Target audience: tech leaders, startup founders, investors, digital transformation consultants, fintech professionals.

STRICT RULES — follow exactly:
1. Only include events with a CONFIRMED specific date — day, month, AND year all known. Skip uncertain dates entirely.
2. Only include events happening AFTER today (${today}). No past events.
3. Dates MUST be in YYYY-MM-DD format (e.g. ${today}).
4. Only include events in the specified cities: ${selectedCities.join(', ')}.
5. Only include events matching these categories: ${selectedCats.join(', ')}.
6. Return 8–12 events. If fewer confirmed upcoming events exist, return only those — do not pad.

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
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const filters: SearchFilters = await req.json()
    const cacheKey = buildCacheKey(filters)

    // ── 1. Check cache ──────────────────────────────────────────────────────
    const cached = await pool.query(
      `SELECT results FROM search_cache
       WHERE filters_key = $1 AND created_at > now() - interval '${CACHE_TTL_MINUTES} minutes'`,
      [cacheKey]
    )

    // ── 2. Check plan & limits ──────────────────────────────────────────────
    const planRow = await pool.query(
      'SELECT plan, plan_expires_at, trial_started_at FROM users WHERE id = $1',
      [user.id]
    )
    const userPlan = planRow.rows[0]
    const planStatus = getPlanStatus(userPlan)

    if (planStatus.status === 'expired') {
      return NextResponse.json(
        { error: 'Your plan has expired. Upgrade to continue searching.', upgradeRequired: true },
        { status: 402 }
      )
    }

    const isTrial = userPlan.plan === 'trial'
    const searchLimit = isTrial ? TRIAL_SEARCHES : PAID_SEARCHES_PER_MONTH

    const usageQuery = isTrial
      ? await pool.query('SELECT COUNT(*) FROM search_usage WHERE user_id = $1', [user.id])
      : await pool.query(
          `SELECT COUNT(*) FROM search_usage WHERE user_id = $1 AND searched_at >= date_trunc('month', now())`,
          [user.id]
        )
    const searchesUsed = parseInt(usageQuery.rows[0].count, 10)

    if (searchesUsed >= searchLimit) {
      const message = isTrial
        ? `You've used all ${TRIAL_SEARCHES} trial searches. Upgrade to continue.`
        : `Monthly search limit reached (${PAID_SEARCHES_PER_MONTH}/month). Resets on the 1st.`
      return NextResponse.json({ error: message, upgradeRequired: isTrial }, { status: 429 })
    }

    if ((cached.rowCount ?? 0) > 0) {
      return NextResponse.json({ events: cached.rows[0].results, cached: true, usage: { used: searchesUsed, limit: searchLimit } })
    }

    // ── 3. Call Claude ──────────────────────────────────────────────────────
    const prompt = buildPrompt(filters)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as never],
      messages: [{ role: 'user', content: prompt }],
    })

    let jsonText = ''
    for (const block of response.content) {
      if (block.type === 'text') { jsonText = block.text; break }
    }

    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const arrayStart = jsonText.indexOf('[')
    const arrayEnd = jsonText.lastIndexOf(']')
    if (arrayStart === -1 || arrayEnd === -1) {
      console.error('No JSON array in Claude response:', jsonText)
      return NextResponse.json({ error: 'No events returned — try different filters or keywords' }, { status: 502 })
    }

    let events
    try {
      events = JSON.parse(jsonText.slice(arrayStart, arrayEnd + 1))
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr)
      return NextResponse.json({ error: 'Failed to parse event data — please try again' }, { status: 502 })
    }

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Unexpected response format — please try again' }, { status: 502 })
    }

    const today = new Date().toISOString().split('T')[0]
    const futureEvents = events.filter((e) => !e.date || e.date >= today)

    // ── 4. Store in cache + record usage ────────────────────────────────────
    await Promise.all([
      pool.query(
        `INSERT INTO search_cache (filters_key, results) VALUES ($1, $2)
         ON CONFLICT (filters_key) DO UPDATE SET results = $2, created_at = now()`,
        [cacheKey, JSON.stringify(futureEvents)]
      ),
      pool.query('INSERT INTO search_usage (user_id) VALUES ($1)', [user.id]),
    ])

    return NextResponse.json({
      events: futureEvents,
      cached: false,
      usage: { used: searchesUsed + 1, limit: searchLimit },
    })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
