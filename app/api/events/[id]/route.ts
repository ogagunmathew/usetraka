import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const fields = Object.keys(body)
    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
    const values = [...fields.map((f) => body[f]), user.id, id]

    const result = await pool.query(
      `UPDATE events SET ${setClauses}, updated_at = now()
       WHERE user_id = $${fields.length + 1} AND id = $${fields.length + 2} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    return NextResponse.json({ event: result.rows[0] })
  } catch (err) {
    console.error('PUT event error:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const result = await pool.query(
      'DELETE FROM events WHERE user_id = $1 AND id = $2',
      [user.id, id]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE event error:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
