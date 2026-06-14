import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { OpportunitySearchFilters } from '@/lib/types'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'
import { TRIAL_SEARCHES, PAID_SEARCHES_PER_MONTH, getPlanStatus } from '@/lib/plans'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CACHE_TTL_HOURS = 24
const POOL_MIN_RESULTS = 5

function buildCacheKey(filters: OpportunitySearchFilters): string {
  const cats = [...(filters.categories || [])].sort().join(',')
  const regions = [...(filters.regions || [])].sort().join(',')
  const { deadline = '', keywords = '' } = filters
  return `opp_${[cats, regions, deadline, keywords.trim().toLowerCase()].join('|')}`
}

function buildPrompt(filters: OpportunitySearchFilters): string {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const allCats = ['Grant', 'Scholarship', 'Incubator', 'Accelerator', 'Tender']
  const selectedCats = filters.categories?.length ? filters.categories : allCats

  const allRegions = ['Africa', 'Global', 'UK/Europe', 'US/Canada', 'Nigeria']
  const selectedRegions = filters.regions?.length ? filters.regions : allRegions

  const end = new Date(now)
  let deadlineDesc = 'the next 3 months'
  switch (filters.deadline) {
    case 'thismonth':   end.setMonth(end.getMonth() + 1, 0); deadlineDesc = `the end of this month (${fmt(end)})`; break
    case 'next3months': end.setMonth(end.getMonth() + 3);    deadlineDesc = `the next 3 months (by ${fmt(end)})`; break
    case 'open':        deadlineDesc = 'any deadline or rolling/open deadlines'; break
    default:            end.setMonth(end.getMonth() + 6);    deadlineDesc = `the next 6 months (by ${fmt(end)})`;
  }

  const keywords = filters.keywords ? `Additional focus: ${filters.keywords}.` : ''

  return `Today's date is ${fmt(now)} (${today}).

Search for opportunities that Nigerians are eligible for — worldwide, on any platform.

Categories wanted: ${selectedCats.join(', ')}.
Regions: ${selectedRegions.join(', ')}.
Deadline window: ${deadlineDesc}.
${keywords}

Definitions:
- Grant: funding for individuals, startups, businesses, or NGOs (no equity taken)
- Scholarship: education funding for students or professionals
- Incubator: early-stage startup support program (workspace, mentorship, seed funding)
- Accelerator: growth-stage startup program with cohort, funding, and demo day
- Tender: public procurement contract open to Nigerian businesses (government or international org)

STRICT RULES — follow exactly:
1. Only include opportunities where Nigerians are EXPLICITLY eligible or where global eligibility is confirmed.
2. Deadline must be in the future after today (${today}). Skip expired ones. Rolling/open deadlines are fine.
3. Deadlines MUST be in YYYY-MM-DD format if known, or null if rolling/unknown.
4. Return 8–12 opportunities. If fewer valid ones exist, return only those.
5. For each, include the DIRECT application link — not a homepage.

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "title": "Opportunity Name",
    "category": "Grant|Scholarship|Incubator|Accelerator|Tender",
    "organiser": "Ford Foundation",
    "deadline": "YYYY-MM-DD or null",
    "funding_amount": "$50,000 | ₦5,000,000 | Equity-free | Varies",
    "eligibility": "1-sentence eligibility summary",
    "description": "2-3 sentence description of what this is and why a Nigerian should apply.",
    "application_url": "https://...",
    "country": "Country where the opportunity is based or 'Global'"
  }
]`
}

async function queryOpportunityPool(filters: OpportunitySearchFilters): Promise<object[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const params: unknown[] = [today]
    const conditions: string[] = ['(deadline IS NULL OR deadline >= $1)']

    if (filters.categories?.length) {
      params.push(filters.categories)
      conditions.push(`category = ANY($${params.length})`)
    }

    if (filters.deadline && filters.deadline !== 'open') {
      const now = new Date()
      const deadlineEnd = new Date(now)
      if (filters.deadline === 'thismonth') {
        deadlineEnd.setMonth(deadlineEnd.getMonth() + 1, 0)
      } else {
        deadlineEnd.setMonth(deadlineEnd.getMonth() + 3)
      }
      params.push(deadlineEnd.toISOString().split('T')[0])
      conditions.push(`(deadline IS NULL OR deadline <= $${params.length})`)
    }

    if (filters.keywords?.trim()) {
      params.push(`%${filters.keywords.trim().toLowerCase()}%`)
      const idx = params.length
      conditions.push(
        `(LOWER(title) LIKE $${idx} OR LOWER(COALESCE(description, '')) LIKE $${idx} OR LOWER(COALESCE(eligibility, '')) LIKE $${idx})`
      )
    }

    // Loose region filter on country field
    if (filters.regions?.length && filters.regions.length < 5) {
      const regionClauses: string[] = []
      for (const region of filters.regions) {
        switch (region) {
          case 'Nigeria':
            regionClauses.push(`country ILIKE 'Nigeria'`)
            break
          case 'Global':
            regionClauses.push(`country ILIKE 'Global'`)
            break
          case 'Africa':
            regionClauses.push(
              `(country IS NOT NULL AND country NOT ILIKE 'Global' AND country NOT ILIKE '%united states%' AND country NOT ILIKE '%canada%' AND country NOT ILIKE '%united kingdom%' AND country NOT ILIKE '%europe%' AND country NOT IN ('Germany','France','Netherlands','Sweden','Switzerland','Norway','Denmark','Finland','Belgium','Austria','Italy','Spain','Portugal'))`
            )
            break
          case 'UK/Europe':
            regionClauses.push(
              `(country ILIKE '%united kingdom%' OR country ILIKE '%europe%' OR country IN ('Germany','France','Netherlands','Sweden','Switzerland','Norway','Denmark','Finland','Belgium','Austria','Italy','Spain','Portugal','UK'))`
            )
            break
          case 'US/Canada':
            regionClauses.push(
              `(country ILIKE '%united states%' OR country IN ('USA','US','Canada'))`
            )
            break
        }
      }
      if (regionClauses.length) {
        conditions.push(`(${regionClauses.join(' OR ')})`)
      }
    }

    const result = await pool.query(
      `SELECT title, category, organiser,
              to_char(deadline, 'YYYY-MM-DD') AS deadline,
              funding_amount, eligibility, description, application_url, country
       FROM opportunity_pool
       WHERE ${conditions.join(' AND ')}
       ORDER BY deadline ASC NULLS LAST
       LIMIT 20`,
      params
    )
    return result.rows
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const filters: OpportunitySearchFilters = await req.json()
    const cacheKey = buildCacheKey(filters)

    // ── 1. Check cache (24h TTL) ─────────────────────────────────────────────
    const cached = await pool.query(
      `SELECT results FROM search_cache
       WHERE filters_key = $1 AND created_at > now() - interval '${CACHE_TTL_HOURS} hours'`,
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

    // ── 3. Return from cache if hit ─────────────────────────────────────────
    if ((cached.rowCount ?? 0) > 0) {
      return NextResponse.json({
        opportunities: cached.rows[0].results,
        cached: true,
        usage: { used: searchesUsed, limit: searchLimit },
      })
    }

    // ── 4. Query opportunity pool (free, no quota) ──────────────────────────
    const poolOpps = await queryOpportunityPool(filters)

    if (poolOpps.length >= POOL_MIN_RESULTS) {
      await pool.query(
        `INSERT INTO search_cache (filters_key, results) VALUES ($1, $2)
         ON CONFLICT (filters_key) DO UPDATE SET results = $2, created_at = now()`,
        [cacheKey, JSON.stringify(poolOpps)]
      )
      return NextResponse.json({
        opportunities: poolOpps,
        cached: false,
        fromPool: true,
        usage: { used: searchesUsed, limit: searchLimit },
      })
    }

    // ── 5. Check quota before calling Claude ────────────────────────────────
    if (searchesUsed >= searchLimit) {
      if (poolOpps.length > 0) {
        return NextResponse.json({
          opportunities: poolOpps,
          cached: false,
          fromPool: true,
          usage: { used: searchesUsed, limit: searchLimit },
        })
      }
      const message = isTrial
        ? `You've used all ${TRIAL_SEARCHES} trial searches. Upgrade to continue.`
        : `Monthly search limit reached (${PAID_SEARCHES_PER_MONTH}/month). Resets on the 1st.`
      return NextResponse.json({ error: message, upgradeRequired: isTrial }, { status: 429 })
    }

    // ── 6. Call Claude (live AI search) ─────────────────────────────────────
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
      return NextResponse.json({ error: 'No opportunities returned — try different filters or keywords' }, { status: 502 })
    }

    let opportunities
    try {
      opportunities = JSON.parse(jsonText.slice(arrayStart, arrayEnd + 1))
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr)
      return NextResponse.json({ error: 'Failed to parse opportunity data — please try again' }, { status: 502 })
    }

    if (!Array.isArray(opportunities)) {
      return NextResponse.json({ error: 'Unexpected response format — please try again' }, { status: 502 })
    }

    const today = new Date().toISOString().split('T')[0]
    const valid = opportunities.filter((o) => !o.deadline || o.deadline >= today)

    // ── 7. Cache results + record usage ─────────────────────────────────────
    await Promise.all([
      pool.query(
        `INSERT INTO search_cache (filters_key, results) VALUES ($1, $2)
         ON CONFLICT (filters_key) DO UPDATE SET results = $2, created_at = now()`,
        [cacheKey, JSON.stringify(valid)]
      ),
      pool.query('INSERT INTO search_usage (user_id) VALUES ($1)', [user.id]),
    ])

    return NextResponse.json({
      opportunities: valid,
      cached: false,
      fromPool: false,
      usage: { used: searchesUsed + 1, limit: searchLimit },
    })
  } catch (err) {
    console.error('Opportunity search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
