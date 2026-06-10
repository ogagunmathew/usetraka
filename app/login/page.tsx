'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const PHRASES = ['For the Culture', 'For the Ecosystem', 'For the Outgoers']

function LeftPanel() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = PHRASES[phraseIndex]
    if (!deleting && displayed === current) {
      const t = setTimeout(() => setDeleting(true), 1800)
      return () => clearTimeout(t)
    }
    if (deleting && displayed === '') {
      setDeleting(false)
      setPhraseIndex(i => (i + 1) % PHRASES.length)
      return
    }
    const t = setTimeout(() => {
      setDisplayed(deleting ? displayed.slice(0, -1) : current.slice(0, displayed.length + 1))
    }, deleting ? 38 : 62)
    return () => clearTimeout(t)
  }, [displayed, deleting, phraseIndex])

  return (
    <div className="auth-left">
      <div className="auth-grid" aria-hidden />
      <div className="auth-glow" aria-hidden />
      <div className="auth-left-content">
        <div className="auth-quote-mark">&ldquo;</div>
        <p className="auth-headline">Curated List of<br />Most Amazing Events</p>
        <p className="auth-typewriter">
          {displayed}<span className="auth-cursor" />
        </p>
        <div className="auth-pills">
          <span className="auth-pill">Lagos</span>
          <span className="auth-pill">Abuja</span>
          <span className="auth-pill">Port Harcourt</span>
          <span className="auth-pill">+ 3 cities</span>
        </div>
      </div>
      <p className="auth-left-footer">Eventraka &copy; 2026</p>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/app'

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requiresVerification) {
          router.push(`/verify?email=${encodeURIComponent(data.email)}`)
          return
        }
        setError(data.error || 'Login failed')
        return
      }
      router.push(from)
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
            <Image src="/logo.png" alt="Eventraka" width={180} height={48} priority unoptimized style={{ objectFit: 'contain' }} />
          </div>
          <div className="auth-divider" />
          <div className="auth-heading">
            <h1>Welcome back</h1>
            <p>Sign in to your Eventraka dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                  placeholder="Enter your password" />
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
                  <circle cx="8" cy="8" r="7" stroke="#4f8ef7" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 10.5v.5" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <><span className="auth-spinner" />Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-root { display: flex; min-height: 100vh; }

        /* ── Left 50% ── */
        .auth-left {
          display: none;
          position: relative;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          background: var(--bg);
          overflow: hidden;
        }
        @media (min-width: 1024px) { .auth-left { display: flex; width: 50%; } }

        .auth-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(79,142,247,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(79,142,247,0.05) 1px,transparent 1px); background-size: 48px 48px; }
        .auth-glow { position: absolute; top: -80px; right: -80px; width: 520px; height: 520px; background: radial-gradient(ellipse at center,rgba(79,142,247,0.13) 0%,transparent 65%); pointer-events: none; }

        .auth-left-content { position: relative; z-index: 1; margin-top: auto; margin-bottom: auto; }
        .auth-quote-mark { font-size: 6rem; line-height: 1; font-family: Georgia,serif; color: #4f8ef7; opacity: 0.45; margin-bottom: -1.25rem; display: block; }

        .auth-headline {
          font-size: clamp(2rem, 3vw, 2.75rem);
          font-weight: 900;
          color: var(--text);
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 0 0 1.25rem;
        }

        .auth-typewriter {
          font-size: clamp(1.125rem, 1.8vw, 1.375rem);
          font-weight: 600;
          color: #4f8ef7;
          line-height: 1.5;
          margin: 0 0 2rem;
          min-height: 2em;
        }

        .auth-cursor {
          display: inline-block;
          width: 2.5px;
          height: 1em;
          background: #4f8ef7;
          margin-left: 3px;
          vertical-align: middle;
          border-radius: 2px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .auth-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .auth-pill { font-size: 0.75rem; font-weight: 600; padding: 0.3rem 0.8rem; border-radius: 999px; background: rgba(79,142,247,0.1); color: #4f8ef7; border: 1px solid rgba(79,142,247,0.25); }
        .auth-left-footer { position: relative; z-index: 1; font-size: 0.8rem; color: var(--text-muted); opacity: 0.45; margin: 0; }

        /* ── Right 50% ── */
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
        .auth-divider { height: 1px; background: linear-gradient(90deg,transparent,var(--border),transparent); margin-bottom: 1.75rem; }
        .auth-heading { margin-bottom: 1.75rem; }
        .auth-heading h1 { font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0 0 0.25rem; letter-spacing: -0.02em; }
        .auth-heading p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
        .auth-form { display: flex; flex-direction: column; gap: 1rem; }
        .auth-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .auth-field label { font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); }
        .auth-field input { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 0.6875rem 0.875rem; color: var(--text); font-size: 0.9375rem; outline: none; width: 100%; }
        .auth-field input::placeholder { color: var(--text-muted); opacity: 0.5; }
        .auth-field input:focus { border-color: #4f8ef7; box-shadow: 0 0 0 3px rgba(79,142,247,0.12); }
        .auth-input-wrap { position: relative; display: flex; align-items: center; }
        .auth-input-wrap input { padding-right: 2.75rem; }
        .auth-eye { position: absolute; right: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0; display: flex; align-items: center; }
        .auth-eye:hover { color: var(--text); }
        .auth-error { display: flex; align-items: center; gap: 0.5rem; background: rgba(79,142,247,0.08); border: 1px solid rgba(79,142,247,0.25); border-radius: 8px; padding: 0.625rem 0.875rem; color: #4f8ef7; font-size: 0.875rem; animation: shake 0.3s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .auth-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #4f8ef7; color: #fff; border: none; border-radius: 8px; padding: 0.75rem; font-size: 0.9375rem; font-weight: 600; cursor: pointer; margin-top: 0.25rem; letter-spacing: 0.01em; }
        .auth-btn:hover:not(:disabled) { opacity: 0.9; }
        .auth-btn:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg) } }
        .auth-switch { text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--text-muted); }
        .auth-switch a { color: #4f8ef7; text-decoration: none; font-weight: 500; }
        .auth-switch a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
