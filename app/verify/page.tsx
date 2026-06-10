'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const error = searchParams.get('error')

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState('')

  async function handleResend() {
    if (!email) return
    setResending(true)
    setResendError('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setResent(true)
      else setResendError('Failed to resend — please try again')
    } catch {
      setResendError('Something went wrong')
    } finally {
      setResending(false)
    }
  }

  if (error === 'invalid') {
    return (
      <VerifyShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
            Invalid link
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
            This verification link is invalid or has already been used.
          </p>
          <Link href="/signup" className="verify-btn">Create a new account</Link>
        </div>
      </VerifyShell>
    )
  }

  if (error === 'expired') {
    return (
      <VerifyShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏰</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
            Link expired
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
            Your verification link has expired. Request a new one below.
          </p>
          {resent ? (
            <p style={{ color: '#4ade80', fontSize: '0.875rem' }}>✓ New verification email sent!</p>
          ) : (
            <button onClick={handleResend} disabled={resending || !email} className="verify-btn">
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          )}
          {resendError && <p style={{ color: 'var(--accent)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>{resendError}</p>}
        </div>
      </VerifyShell>
    )
  }

  return (
    <VerifyShell>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
          Check your email
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
          We sent a verification link to
        </p>
        {email && (
          <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 1.5rem' }}>
            {email}
          </p>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
          Click the link in the email to verify your account and sign in. The link expires in 24 hours.
        </p>

        {resent ? (
          <p style={{ color: '#4ade80', fontSize: '0.875rem', marginBottom: '1rem' }}>✓ Verification email resent!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleResend}
              disabled={resending || !email}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '0.6rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem',
                cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              {resending ? 'Sending…' : "Didn't receive it? Resend"}
            </button>
            {resendError && <p style={{ color: 'var(--accent)', fontSize: '0.8125rem' }}>{resendError}</p>}
          </div>
        )}

        <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Wrong email?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign up again</Link>
        </p>
      </div>
    </VerifyShell>
  )
}

function VerifyShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(233,69,96,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(233,69,96,0.04) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%,black 30%,transparent 100%)' }} aria-hidden />
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem 2rem', position: 'relative', boxShadow: '0 0 0 1px rgba(233,69,96,0.06),0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Image src="/logo.png" alt="Eventraka" width={160} height={44} priority unoptimized style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,var(--border),transparent)', marginBottom: '1.75rem' }} />
        {children}
      </div>
      <style>{`.verify-btn{display:inline-block;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:.7rem 1.5rem;font-size:.9375rem;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s}.verify-btn:hover{opacity:.9}`}</style>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
