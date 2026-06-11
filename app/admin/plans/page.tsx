'use client'

import { useState, useEffect } from 'react'
import { Check, Edit2, Save, X, ExternalLink } from 'lucide-react'

interface PlanConfig {
  key: string; label: string; price_kobo: number; months: number
  features: string[]; highlighted: boolean; tag: string | null
  updated_at?: string
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<PlanConfig>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plans) setPlans(d.plans) })
      .finally(() => setLoading(false))
  }, [])

  function startEdit(plan: PlanConfig) {
    setEditing(plan.key)
    setDraft({ ...plan, features: [...plan.features] })
  }

  function cancelEdit() { setEditing(null); setDraft({}) }

  async function savePlan() {
    if (!draft.key) return
    setSaving(true)
    const res = await fetch('/api/admin/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (res.ok) {
      setPlans(prev => prev.map(p => p.key === draft.key ? { ...p, ...draft } as PlanConfig : p))
      setEditing(null)
      setSaved(draft.key)
      setTimeout(() => setSaved(null), 3000)
    }
    setSaving(false)
  }

  const inputCls = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.875rem', padding: '0.5rem 0.75rem', borderRadius: '8px', width: '100%', outline: 'none' }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Plans</h1>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Edit plan details — changes reflect immediately on the pricing page.</p>
        </div>
        <a href="/pricing" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', border: '1px solid var(--accent-border)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: 600 }}>
          <ExternalLink size={13} /> View pricing page
        </a>
      </div>

      {saved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
          <Check size={14} /> Plan saved — pricing page is updated.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }} className="plans-grid">
        {plans.map(plan => {
          const isEditing = editing === plan.key
          const d = isEditing ? draft : plan
          const priceNaira = Math.round((d.price_kobo ?? plan.price_kobo) / 100)
          const perMonth = Math.round(priceNaira / (d.months ?? plan.months))

          return (
            <div key={plan.key} style={{ background: 'var(--surface)', border: `1px solid ${plan.highlighted ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: '14px', overflow: 'hidden' }}>
              {/* Card header */}
              <div style={{ padding: '1.125rem 1.25rem 0.875rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: plan.highlighted ? 'var(--accent-dim)' : undefined }}>
                {isEditing ? (
                  <input value={d.label ?? ''} onChange={e => setDraft(prev => ({ ...prev, label: e.target.value }))}
                    style={{ ...inputCls, fontWeight: 700, fontSize: '1rem', padding: '0.3rem 0.5rem' }} />
                ) : (
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{plan.label}</h3>
                )}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                    <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                    <button onClick={savePlan} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(plan)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                    <Edit2 size={11} /> Edit
                  </button>
                )}
              </div>

              <div style={{ padding: '1.125rem 1.25rem' }}>
                {/* Price */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Price</p>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>₦</span>
                      <input type="number" value={Math.round((d.price_kobo ?? 0) / 100)}
                        onChange={e => setDraft(prev => ({ ...prev, price_kobo: parseInt(e.target.value) * 100 || 0 }))}
                        style={{ ...inputCls, width: '120px' }} placeholder="e.g. 4500" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kobo × 100</span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em' }}>₦{priceNaira.toLocaleString()}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.375rem' }}>· ₦{perMonth.toLocaleString()}/mo</span>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Duration (months)</p>
                  {isEditing ? (
                    <input type="number" value={d.months ?? ''} onChange={e => setDraft(prev => ({ ...prev, months: parseInt(e.target.value) || 1 }))}
                      style={{ ...inputCls, width: '100px' }} />
                  ) : (
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{plan.months} months</span>
                  )}
                </div>

                {/* Tag */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Badge tag (optional)</p>
                  {isEditing ? (
                    <input value={d.tag ?? ''} onChange={e => setDraft(prev => ({ ...prev, tag: e.target.value || null }))}
                      style={inputCls} placeholder="e.g. Most Popular" />
                  ) : (
                    <span style={{ fontSize: '0.875rem', color: plan.tag ? 'var(--accent)' : 'var(--text-muted)' }}>{plan.tag ?? 'None'}</span>
                  )}
                </div>

                {/* Highlighted */}
                {isEditing && (
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id={`hl-${plan.key}`} checked={d.highlighted ?? false}
                      onChange={e => setDraft(prev => ({ ...prev, highlighted: e.target.checked }))} />
                    <label htmlFor={`hl-${plan.key}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Highlight this card (Most Popular style)</label>
                  </div>
                )}

                {/* Features */}
                <div>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Features</p>
                  {isEditing ? (
                    <textarea
                      value={(d.features ?? []).join('\n')}
                      onChange={e => setDraft(prev => ({ ...prev, features: e.target.value.split('\n').filter(Boolean) }))}
                      rows={6}
                      style={{ ...inputCls, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                      placeholder="One feature per line"
                    />
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <Check size={12} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {plan.updated_at && !isEditing && (
                  <p style={{ margin: '0.875rem 0 0', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Last updated: {new Date(plan.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@media (max-width: 800px) { .plans-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
