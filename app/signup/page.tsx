'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const PHRASES = [
  'AI-powered. Updated in real time.',
  'Events, grants, scholarships, tenders.',
  'Nigerian cities. Global opportunities.',
  'Never miss a deadline again.',
]

function LeftPanel() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = PHRASES[phraseIndex]
    if (!deleting && displayed === current) {
      const t = setTimeout(() => setDeleting(true), 2000)
      return () => clearTimeout(t)
    }
    if (deleting && displayed === '') {
      setDeleting(false)
      setPhraseIndex(i => (i + 1) % PHRASES.length)
      return
    }
    const t = setTimeout(() => {
      setDisplayed(deleting ? displayed.slice(0, -1) : current.slice(0, displayed.length + 1))
    }, deleting ? 32 : 55)
    return () => clearTimeout(t)
  }, [displayed, deleting, phraseIndex])

  return (
    <div className="auth-left">
      <div className="auth-grid" aria-hidden />
      <div className="auth-glow" aria-hidden />

      <div className="auth-left-content">
        <p className="auth-headline">
          Stop finding out<br />after the window closed.
        </p>
        <p className="auth-typewriter">
          {displayed}<span className="auth-cursor" />
        </p>
      </div>

      <p className="auth-left-footer">Traka &copy; 2026</p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }))
      if (!res.ok) { setError(data.error || 'Signup failed'); return }
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`)
      router.refresh()
    } catch {
      setError('Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <LeftPanel />

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo-wrap">
            <Logo size="lg" />
          </div>
          <div className="auth-divider" />
          <div className="auth-heading">
            <h1>Start your free trial</h1>
            <p>7 days free · no credit card required</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                required autoFocus autoComplete="name" placeholder="Your name" />
            </div>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                  placeholder="At least 8 characters" />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 10.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <><span className="auth-spinner" />Creating account…</> : 'Create free account'}
            </button>
          </form>

          <p className="auth-terms">
            By signing up you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-root { display: flex; min-height: 100vh; }

        /* ── Left panel ── */
        .auth-left {
          display: none;
          position: relative;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem 3rem;
          background: var(--bg);
          overflow: hidden;
        }
        @media (min-width: 1024px) { .auth-left { display: flex; width: 50%; } }

        .auth-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(79,142,247,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,142,247,0.045) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .auth-glow {
          position: absolute; top: -100px; right: -100px;
          width: 580px; height: 580px;
          background: radial-gradient(ellipse at center, rgba(79,142,247,0.12) 0%, transparent 62%);
          pointer-events: none;
        }

        .auth-left-content { position: relative; z-index: 1; margin-top: auto; margin-bottom: auto; }

        .auth-headline {
          font-size: clamp(1.875rem, 2.8vw, 2.625rem);
          font-weight: 900;
          color: var(--text);
          line-height: 1.18;
          letter-spacing: -0.035em;
          margin: 0 0 1.125rem;
        }

        .auth-typewriter {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          font-weight: 500;
          color: var(--accent);
          line-height: 1.5;
          margin: 0;
          min-height: 1.875em;
          opacity: 0.85;
        }

        .auth-cursor {
          display: inline-block; width: 2px; height: 1em;
          background: var(--accent); margin-left: 3px;
          vertical-align: middle; border-radius: 2px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .auth-left-footer { position: relative; z-index: 1; font-size: 0.78rem; color: var(--text-muted); opacity: 0.4; margin: 0; }

        /* ── Right panel ── */
        .auth-right {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          background: var(--surface);
          min-height: 100vh;
        }
        @media (min-width: 1024px) {
          .auth-right { width: 50%; min-height: auto; border-left: 1px solid var(--border); }
        }

        .auth-card { width: 100%; max-width: 380px; }
        .auth-logo-wrap { display: flex; justify-content: center; margin-bottom: 1.75rem; }
        .auth-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin-bottom: 1.75rem; }
        .auth-heading { margin-bottom: 1.75rem; }
        .auth-heading h1 { font-size: 1.25rem; font-weight: 800; color: var(--text); margin: 0 0 0.3rem; letter-spacing: -0.025em; }
        .auth-heading p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

        .auth-form { display: flex; flex-direction: column; gap: 1rem; }
        .auth-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .auth-field label { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); }
        .auth-field input {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 9px; padding: 0.6875rem 0.875rem;
          color: var(--text); font-size: 0.9375rem; outline: none; width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .auth-field input::placeholder { color: var(--text-muted); opacity: 0.45; }
        .auth-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
        .auth-input-wrap { position: relative; display: flex; align-items: center; }
        .auth-input-wrap input { padding-right: 2.75rem; }
        .auth-eye { position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0; display: flex; align-items: center; }
        .auth-eye:hover { color: var(--text); }

        .auth-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
          border-radius: 8px; padding: 0.625rem 0.875rem;
          color: #f87171; font-size: 0.875rem;
          animation: shake 0.3s ease;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

        .auth-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          background: var(--accent); color: #fff; border: none;
          border-radius: 9px; padding: 0.78rem; font-size: 0.9375rem;
          font-weight: 700; cursor: pointer; margin-top: 0.25rem;
          letter-spacing: 0.01em; transition: opacity 0.15s, transform 0.1s;
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.9; }
        .auth-btn:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .auth-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        .auth-terms { text-align: center; margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }
        .auth-switch { text-align: center; margin-top: 0.625rem; font-size: 0.875rem; color: var(--text-muted); }
        .auth-switch a { color: var(--accent); text-decoration: none; font-weight: 600; }
        .auth-switch a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
