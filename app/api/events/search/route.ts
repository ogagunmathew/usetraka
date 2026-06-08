import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SearchFilters } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildPrompt(filters: SearchFilters): string {
  const timeframeMap: Record<string, string> = {
    '3months': 'the next 3 months',
    '6months': 'the next 6 months',
    'thismonth': 'this month',
    'nextmonth': 'next month',
  }
  const timeframe = timeframeMap[filters.timeframe || '3months'] || 'the next 3 months'
  const category = filters.category && filters.category !== 'All' ? filters.category : 'all professional categories'
  const budget = filters.budget === 'free' ? 'free events only' : filters.budget === '25k' ? 'events under ₦25,000' : 'any budget'
  const keywords = filters.keywords ? `Focus on: ${filters.keywords}.` : ''

  return `Search for professional events happening in Lagos, Nigeria during ${timeframe}.
Category focus: ${category}. Budget: ${budget}. ${keywords}

Find 8-12 real, upcoming events relevant to tech leaders, startup founders, investors, digital transformation consultants, and fintech professionals in Lagos.

Return ONLY a JSON array (no markdown, no explanation) with this exact schema:
[
  {
    "name": "Event Name",
    "category": "Tech/Startup | Investment | Networking | Leadership | Product/UX | Fintech | Policy | Tech/Policy | Other",
    "date": "DD-MMM-YY",
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
  try {
    const filters: SearchFilters = await req.json()
    const prompt = buildPrompt(filters)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305' as never, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract the text content from the response
    let jsonText = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        jsonText = block.text
        break
      }
    }

    // Strip markdown fences if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Find JSON array in the text
    const arrayStart = jsonText.indexOf('[')
    const arrayEnd = jsonText.lastIndexOf(']')
    if (arrayStart !== -1 && arrayEnd !== -1) {
      jsonText = jsonText.slice(arrayStart, arrayEnd + 1)
    }

    const events = JSON.parse(jsonText)
    return NextResponse.json({ events })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
