import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { PLANS, PlanId } from '@/lib/plans'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref')
  if (!reference) return NextResponse.redirect(new URL('/pricing?payment=failed', req.url))

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const data = await res.json()

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.redirect(new URL('/pricing?payment=failed', req.url))
    }

    const { user_id, plan, months } = data.data.metadata
    if (!user_id || !plan || !(plan in PLANS)) {
      return NextResponse.redirect(new URL('/pricing?payment=failed', req.url))
    }

    await activatePlan(user_id, plan as PlanId, months)

    return NextResponse.redirect(new URL('/app?payment=success', req.url))
  } catch (err) {
    console.error('Payment callback error:', err)
    return NextResponse.redirect(new URL('/pricing?payment=failed', req.url))
  }
}

export async function activatePlan(userId: string, plan: PlanId, months: number) {
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)
  await pool.query(
    'UPDATE users SET plan = $1, plan_expires_at = $2 WHERE id = $3',
    [plan, expiresAt, userId]
  )
}
