import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const fields = Object.keys(body)
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
    const values = fields.map((f) => body[f])
    values.push(id)

    const result = await pool.query(
      `UPDATE events SET ${setClauses}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
      values
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ event: result.rows[0] })
  } catch (err) {
    console.error('PUT event error:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await pool.query('DELETE FROM events WHERE id = $1', [id])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE event error:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
