import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { PLANS, PlanId } from '@/lib/plans'
import { activatePlan } from '../callback/route'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-paystack-signature')
  const body = await req.text()

  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const { user_id, plan, months } = event.data.metadata || {}
    if (user_id && plan && plan in PLANS) {
      await activatePlan(user_id, plan as PlanId, months)
    }
  }

  return NextResponse.json({ ok: true })
}
