import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Search, Bell, Calendar, MapPin, Clock, Check, Filter, Zap, Globe } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Logo } from '@/components/ui/logo'

export const metadata: Metadata = {
  title: 'Traka — Nigeria Event & Opportunity Intelligence',
  description: 'AI-powered discovery of events across Nigerian cities and global opportunities open to Nigerians — grants, scholarships, accelerators, and tenders.',
}

const MOCK_EVENTS = [
  { name: 'West Africa Fintech Forum', org: 'EFInA Lagos', city: 'Lagos', date: 'Jul 8', cat: 'Fintech', color: '#10b981' },
  { name: 'TechConnect Abuja Summit', org: 'NITDA', city: 'Abuja', date: 'Jul 22', cat: 'Tech', color: '#4f8ef7' },
  { name: 'StartupXchange Nigeria', org: 'Ventures Platform', city: 'Lagos', date: 'Aug 5', cat: 'Investments', color: '#f59e0b' },
]

const STEPS = [
  {
    n: '01',
    title: 'Search',
    body: 'Pick your filters — city and category for events, region and type for opportunities. Traka runs a live AI search, not a database someone last updated in January.',
  },
  {
    n: '02',
    title: 'Save',
    body: 'One click adds anything to your personal tracker. Mark events as Interested, Attending, or Attended. Track opportunities from Saved through to Applied and Awarded.',
  },
  {
    n: '03',
    title: 'Never miss it',
    body: 'Get an email reminder 7 days before every event and every opportunity deadline. You\'ll stop finding out after the window closed.',
  },
]

const FEATURES = [
  { icon: Zap, title: 'Live AI event search', body: 'Claude searches the web for upcoming events in real time across 6 Nigerian cities. No stale listings, no manual curation.' },
  { icon: Globe, title: 'Global opportunity search', body: 'Find grants, scholarships, accelerators, and tenders from anywhere in the world — filtered to what Nigerians are eligible for.' },
  { icon: MapPin, title: '6 Nigerian cities', body: 'Lagos, Abuja, Port Harcourt, Kano, Abeokuta, Ilorin. Filter any combination in a single events search.' },
  { icon: Filter, title: '5 opportunity categories', body: 'Grants, Scholarships, Incubators, Accelerators, and Tenders — the opportunities that actually matter for your career or business.' },
  { icon: Bell, title: 'Deadline & event reminders', body: 'An email lands 7 days before each tracked event date or opportunity deadline. You\'ll stop missing things you saved.' },
  { icon: Calendar, title: 'Personal tracker', body: 'Save events and opportunities, update status, export to CSV, and add events to Google Calendar — all in one place.' },
]

const PAID_FEATURES = [
  'AI event search across 6 Nigerian cities',
  'AI opportunity search — grants, scholarships, accelerators, tenders',
  '100 searches/month (events + opportunities)',
  'Personal tracker with status management',
  '7-day email reminders before deadlines',
  'CSV export · Google Calendar integration',
]

const PLANS_PREVIEW = [
  {
    name: 'Free Trial', price: 'Free', sub: '7 days · 2 searches',
    green: true, cta: 'Start free', href: '/signup',
    features: [
      'Events + Opportunities search',
      '2 searches (events & opportunities)',
      '7-day access · all features unlocked',
      'No credit card required',
    ],
  },
  {
    name: 'Starter', price: '₦4,500', sub: '3 months · ₦1,500/mo',
    green: false, cta: 'Get Starter', href: '/pricing',
    features: PAID_FEATURES,
  },
  {
    name: 'Growth', price: '₦7,800', sub: '6 months · ₦1,300/mo',
    green: false, cta: 'Get Growth', href: '/pricing', popular: true,
    features: [...PAID_FEATURES, 'Save 13% vs monthly rate'],
  },
  {
    name: 'Annual', price: '₦13,200', sub: '12 months · ₦1,100/mo',
    green: false, cta: 'Get Annual', href: '/pricing',
    features: [...PAID_FEATURES, 'Best rate — save 27%'],
  },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Nav ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <Link href="/login" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
              className="hover-muted">
              Sign in
            </Link>
            <Link href="/signup" style={{ fontSize: '0.875rem', fontWeight: 600, background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '0.5rem 1.125rem', borderRadius: '8px' }}>
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.5rem 4rem', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}
          className="hero-grid">

          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', padding: '0.3rem 0.75rem', borderRadius: '999px', marginBottom: '1.5rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
              Events · Opportunities · Built for Nigerians
            </div>

            <h1 style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '0 0 1.25rem', color: 'var(--text)' }}>
              Stop missing things{' '}
              <span style={{ color: 'var(--accent)' }}>built for you.</span>
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 2.25rem', maxWidth: '520px' }}>
              Traka uses AI to surface professional events across 6 Nigerian cities, and global opportunities — grants, scholarships, accelerators, tenders — that Nigerians are eligible for. All in one place, before the deadline closes.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <Link href="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--accent)', color: '#fff', textDecoration: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9375rem',
              }}>
                Start for free <ArrowRight size={16} />
              </Link>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'transparent', color: 'var(--text-muted)', textDecoration: 'none',
                padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9375rem',
                border: '1px solid var(--border)',
              }}>
                Sign in
              </Link>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={12} style={{ color: '#10b981' }} />
              7-day trial · 2 searches · no credit card
            </p>
          </div>

          {/* Right — product mockup */}
          <div className="hero-mockup" style={{ position: 'relative' }}>
            {/* Window chrome */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}>
              {/* Title bar */}
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['#ef4444', '#f59e0b', '#10b981'].map(c => (
                    <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <div style={{ flex: 1, height: '22px', background: 'var(--bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', gap: '0.5rem' }}>
                  <Search size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.01em' }}>Tech · Lagos · Next 3 months</span>
                </div>
              </div>

              {/* Chip strip */}
              <div style={{ padding: '0.75rem 1rem 0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['Tech', 'Fintech', 'Investments'].map((c, i) => (
                  <span key={c} style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px',
                    background: i === 0 ? 'var(--accent)' : 'var(--surface2)',
                    color: i === 0 ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                    {c}
                  </span>
                ))}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '0.25rem' }}>+2 more</span>
              </div>

              {/* Event cards */}
              <div style={{ padding: '0.5rem 0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {MOCK_EVENTS.map((e) => (
                  <div key={e.name} style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ height: '3px', background: e.color }} />
                    <div style={{ padding: '0.625rem 0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{e.name}</p>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: `${e.color}1a`, color: e.color, border: `1px solid ${e.color}40`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {e.cat}
                        </span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {e.org} · {e.city} · {e.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div style={{ padding: '0.5rem 0.875rem 0.875rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.6rem' }}>
                  3 events found
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{
              position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--surface)', border: '1px solid var(--accent-border)',
              borderRadius: '999px', padding: '0.35rem 0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)',
              whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(79,142,247,0.15)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live search via Claude AI
            </div>
          </div>
        </div>
      </section>

      {/* ── City strip ── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0.875rem 1.5rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.5, marginRight: '0.25rem' }}>
            Covered cities
          </span>
          <span style={{ color: 'var(--border)', fontSize: '0.75rem', opacity: 0.4, marginRight: '0.25rem' }}>—</span>
          {['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Abeokuta', 'Ilorin'].map((city, i, arr) => (
            <span key={city} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{city}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--border)', fontSize: '0.75rem', opacity: 0.4 }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '6rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            How it works
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
            Three steps. That&apos;s it.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="steps-grid">
          {STEPS.map((step) => (
            <div key={step.n} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em',
                color: 'var(--accent-border)',
              }}>
                {step.n}
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'system-ui' }}>
                  {step.n.replace('0', '')}
                </span>
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.625rem', letterSpacing: '-0.02em' }}>{step.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
              What you get
            </p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
              Built for people who actually show up.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.5rem',
              }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <f.icon size={17} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
          Who uses Traka
        </p>
        <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '2.5rem' }}>
          If you&apos;re building, funding, or growing in Nigeria — events and opportunities find you here.
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.625rem' }}>
          {['Startup Founders', 'Tech Leads', 'VCs & Angel Investors', 'Digital Transformation Consultants', 'Fintech Professionals', 'Creative Directors', 'Product Managers', 'Students & Early-Career Professionals', 'NGO Leaders', 'SME Owners'].map(r => (
            <span key={r} style={{
              fontSize: '0.875rem', fontWeight: 500, padding: '0.45rem 1rem', borderRadius: '999px',
              background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)',
            }}>
              {r}
            </span>
          ))}
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
              Pricing
            </p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
              Start free. No card needed.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="pricing-grid">
            {PLANS_PREVIEW.map((plan) => (
              <div key={plan.name} style={{
                background: plan.popular ? 'linear-gradient(145deg, #0d1a3a, #111e35)' : 'var(--bg)',
                border: `1px solid ${plan.popular ? 'rgba(79,142,247,0.4)' : 'var(--border)'}`,
                borderRadius: '14px', padding: '1.5rem',
                boxShadow: plan.popular ? '0 0 0 1px rgba(79,142,247,0.08), 0 16px 40px rgba(79,142,247,0.08)' : 'none',
                position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em', padding: '0.2rem 0.65rem', borderRadius: '999px', background: 'var(--accent)', color: '#fff' }}>
                      POPULAR
                    </span>
                  </div>
                )}
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.625rem', color: 'var(--text)' }}>{plan.name}</h3>
                <div style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.03em', color: plan.green ? '#10b981' : 'var(--text)', lineHeight: 1.1, marginBottom: '0.375rem' }}>
                  {plan.price}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>{plan.sub}</p>
                <ul style={{ listStyle: 'none', margin: '0 0 1.25rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      <Check size={12} style={{ color: plan.green ? '#10b981' : '#4f8ef7', flexShrink: 0, marginTop: '2px' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', padding: '0.55rem 0',
                  borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
                  background: plan.green ? 'rgba(16,185,129,0.12)' : plan.popular ? 'var(--accent)' : 'rgba(79,142,247,0.08)',
                  color: plan.green ? '#10b981' : plan.popular ? '#fff' : 'var(--accent)',
                  border: `1px solid ${plan.green ? 'rgba(16,185,129,0.3)' : plan.popular ? 'transparent' : 'rgba(79,142,247,0.25)'}`,
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Payments via Paystack · Subscriptions do not auto-renew ·{' '}
            <Link href="/pricing" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Full pricing details →</Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '7rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
          The events and opportunities{' '}
          <span style={{ color: 'var(--accent)' }}>you should know about.</span>
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Sign up in 60 seconds. Your first 7 days are free — search for events and opportunities, save what matters, and get reminded before it&apos;s too late.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent)', color: '#fff', textDecoration: 'none',
            padding: '0.875rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
          }}>
            Start your free trial <ArrowRight size={18} />
          </Link>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          No credit card. No commitment. Cancel any time.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Logo size="sm" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>© 2026</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Pricing', href: '/pricing' },
              { label: 'Sign up', href: '/signup' },
              { label: 'Sign in', href: '/login' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .hero-mockup { display: none !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .hover-muted:hover { color: var(--text) !important; background: var(--surface) !important; }
      `}</style>
    </div>
  )
}
