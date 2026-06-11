import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { PLANS, PlanId } from '@/lib/plans'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Try to get price from DB (admin-editable), fall back to constants
  let priceKobo = PLANS[plan as PlanId].price
  let months    = PLANS[plan as PlanId].months
  try {
    const cfg = await pool.query('SELECT price_kobo, months FROM plan_config WHERE key = $1', [plan])
    if (cfg.rows.length > 0) { priceKobo = cfg.rows[0].price_kobo; months = cfg.rows[0].months }
  } catch { /* table may not exist */ }

  const selected = { price: priceKobo, months }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: selected.price,
      currency: 'NGN',
      callback_url: `${appUrl}/api/payments/callback`,
      metadata: {
        user_id: user.id,
        plan: plan,
        months: selected.months,
        cancel_action: `${appUrl}/pricing`,
      },
    }),
  })

  const data = await res.json()

  if (!data.status) {
    console.error('Paystack init error:', data)
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 })
  }

  return NextResponse.json({ authorization_url: data.data.authorization_url })
}
