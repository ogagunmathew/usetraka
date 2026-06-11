'use client'

import { useState } from 'react'
import { Lock, User, Check, AlertCircle } from 'lucide-react'

type Msg = { type: 'success' | 'error'; text: string } | null

export default function SettingsPage() {
  // Change password
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<Msg>(null)

  // Update profile
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<Msg>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Load current user
  useState(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) { setName(d.user.name); setEmail(d.user.email); setProfileLoaded(true) }
      })
  })

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwNew !== pwConfirm) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return }
    if (pwNew.length < 8)    { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return }
    setPwSaving(true); setPwMsg(null)
    const res = await fetch('/api/admin/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    })
    const data = await res.json()
    if (res.ok) {
      setPwMsg({ type: 'success', text: 'Password updated.' })
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
    } else {
      setPwMsg({ type: 'error', text: data.error ?? 'Failed to update password.' })
    }
    setPwSaving(false)
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setProfileMsg({ type: 'error', text: 'Name and email are required.' }); return }
    setProfileSaving(true); setProfileMsg(null)
    const res = await fetch('/api/admin/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
    })
    const data = await res.json()
    if (res.ok) {
      setProfileMsg({ type: 'success', text: 'Profile updated.' })
    } else {
      setProfileMsg({ type: 'error', text: data.error ?? 'Failed to update profile.' })
    }
    setProfileSaving(false)
  }

  const inputCls: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
    fontSize: '0.875rem', padding: '0.625rem 0.875rem', borderRadius: '10px', width: '100%',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelCls: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: '0.375rem',
  }
  const cardCls: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
    padding: '1.5rem', marginBottom: '1.25rem', maxWidth: '520px',
  }

  function Feedback({ msg }: { msg: Msg }) {
    if (!msg) return null
    const ok = msg.type === 'success'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '8px', marginTop: '0.875rem', background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`, color: ok ? '#10b981' : '#f87171', fontSize: '0.8125rem', fontWeight: 600 }}>
        {ok ? <Check size={13} /> : <AlertCircle size={13} />}
        {msg.text}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Manage your admin account and credentials.</p>
      </div>

      {/* Profile card */}
      <div style={cardCls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <User size={15} style={{ color: 'var(--accent)' }} />
          <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Profile</h2>
        </div>
        <form onSubmit={updateProfile}>
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={labelCls}>Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputCls} placeholder="Your name" disabled={!profileLoaded} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelCls}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputCls} placeholder="admin@example.com" disabled={!profileLoaded} />
          </div>
          <button type="submit" disabled={profileSaving || !profileLoaded}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: profileSaving ? 0.6 : 1 }}>
            {profileSaving ? 'Saving…' : 'Save profile'}
          </button>
          <Feedback msg={profileMsg} />
        </form>
      </div>

      {/* Password card */}
      <div style={cardCls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Lock size={15} style={{ color: 'var(--accent)' }} />
          <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Change password</h2>
        </div>
        <form onSubmit={changePassword}>
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={labelCls}>Current password</label>
            <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} style={inputCls} autoComplete="current-password" />
          </div>
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={labelCls}>New password</label>
            <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} style={inputCls} autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelCls}>Confirm new password</label>
            <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} style={inputCls} autoComplete="new-password" />
          </div>
          <button type="submit" disabled={pwSaving}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: pwSaving ? 0.6 : 1 }}>
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
          <Feedback msg={pwMsg} />
        </form>
      </div>
    </div>
  )
}
