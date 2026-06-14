import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export const metadata: Metadata = {
  title: 'Privacy Policy — Traka',
  description: 'How Traka collects, uses, and protects your personal data.',
}

const SECTIONS = [
  {
    title: '1. Who We Are',
    content: 'Traka is operated by Bluespectra Technologies Limited. When we refer to "we", "us", or "our" in this policy, we mean Bluespectra Technologies Limited. For questions about your data, contact us at hello@usetraka.com.',
  },
  {
    title: '2. What Data We Collect',
    content: 'We collect the following information when you use Traka: (a) Account data — your name, email address, and a hashed (one-way encrypted) version of your password when you register; (b) Usage data — search queries you run, events and opportunities you save, status updates you make, and timestamps of these actions; (c) Payment data — when you subscribe, payment is processed by Paystack. We do not receive or store your card details; we only receive confirmation of payment and the plan you purchased; (d) Technical data — your IP address, browser type, and session information collected automatically when you use the Service.',
  },
  {
    title: '3. How We Use Your Data',
    content: 'We use your data to: (a) create and manage your account; (b) enforce search and plan limits; (c) send email reminders for events and opportunities you have saved; (d) send transactional emails such as account verification and payment confirmations; (e) improve the Service and diagnose technical issues; and (f) comply with legal obligations.',
  },
  {
    title: '4. Email Communications',
    content: 'We will send you transactional emails when you sign up (verification), when you make a payment (confirmation), and when a reminder you set is due. We do not send unsolicited marketing emails. You can stop reminder emails by removing saved events or opportunities from your tracker.',
  },
  {
    title: '5. Third-Party Services',
    content: 'We use the following third-party services to operate Traka: (a) Anthropic — powers the AI event and opportunity search. Your search queries (category, city, and keyword filters) are sent to Anthropic\'s API; (b) Paystack — processes subscription payments; (c) Resend — delivers transactional emails; (d) Railway — hosts the application and database. All third-party services are bound by their own privacy policies and data processing terms.',
  },
  {
    title: '6. Data Storage & Security',
    content: 'Your data is stored on Railway\'s infrastructure (PostgreSQL database). Passwords are hashed using bcrypt and are never stored in plain text. Data in transit is encrypted via TLS/HTTPS. We apply reasonable technical and organisational measures to protect your data, though no system is completely secure.',
  },
  {
    title: '7. Data Retention',
    content: 'We retain your account data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where we are required to retain it by law. Search usage records may be retained in anonymised form for service improvement.',
  },
  {
    title: '8. Your Rights',
    content: 'You have the right to: (a) access the personal data we hold about you; (b) request correction of inaccurate data; (c) request deletion of your account and associated data; (d) withdraw consent where processing is based on consent. To exercise any of these rights, contact us at hello@usetraka.com. We will respond within 30 days.',
  },
  {
    title: '9. Cookies & Local Storage',
    content: 'We use an httpOnly session cookie to maintain your login session. We use browser localStorage to remember your theme preference (light or dark). We do not use advertising cookies or third-party tracking.',
  },
  {
    title: '10. Children\'s Privacy',
    content: 'The Service is not intended for users under 18 years of age. We do not knowingly collect data from children. If you believe a child has created an account, contact us and we will delete it.',
  },
  {
    title: '11. Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. We will notify you of material changes by email or via the Service before they take effect. Continued use of the Service after changes are posted constitutes acceptance of the updated policy.',
  },
  {
    title: '12. Contact',
    content: 'For questions, requests, or concerns about this Privacy Policy or how we handle your data, contact us at hello@usetraka.com.',
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>
          <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            Legal
          </p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.75rem', lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Last updated: June 2026
          </p>
        </div>

        {/* Intro */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '3rem',
        }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
            This policy explains what data we collect when you use Traka, why we collect it, and how we protect it. We keep things simple — we collect only what we need to run the service.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 style={{
                fontSize: '0.9375rem', fontWeight: 700,
                margin: '0 0 0.625rem',
                color: 'var(--text)',
                letterSpacing: '-0.01em',
              }}>
                {s.title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
                {s.content}
              </p>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: '4rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Questions about your data?{' '}
            <a href="mailto:hello@usetraka.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              hello@usetraka.com
            </a>
          </p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href="/terms" style={{ fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none' }}>
              Terms of Service →
            </Link>
            <Link href="/signup" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Sign up
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
