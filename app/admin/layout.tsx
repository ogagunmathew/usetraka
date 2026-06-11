'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Globe, Settings, LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const NAV = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users',         icon: Users,           label: 'Users' },
  { href: '/admin/plans',         icon: CreditCard,      label: 'Plans' },
  { href: '/admin/opportunities', icon: Globe,           label: 'Opportunities' },
  { href: '/admin/settings',      icon: Settings,        label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) setCurrentUser(d.user)
        else router.replace('/login')
        setAuthChecked(true)
      })
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const sidebarContent = (
    <div style={{
      width: '232px', background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.125rem 1.25rem 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
          <Logo size="md" />
        </Link>
        <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.625rem 0.625rem', overflowY: 'auto' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {currentUser && (
          <div style={{ marginBottom: '0.75rem', padding: '0 0.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.email}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle />
          <Link href="/app"
            style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', fontWeight: 500 }}>
            ← App
          </Link>
          <button onClick={handleLogout}
            title="Sign out"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', flexShrink: 0, borderRadius: '6px', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .admin-sidebar { display: flex; }
        .admin-mobile-bar { display: none; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-mobile-bar { display: flex; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <div className="admin-sidebar" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, display: 'flex' }}>
            {sidebarContent}
            <button onClick={() => setSidebarOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '-40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
              <X size={16} />
            </button>
          </div>
        </>
      )}

      {/* Content area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile topbar */}
        <div className="admin-mobile-bar"
          style={{ alignItems: 'center', gap: '1rem', padding: '0 1rem', height: '54px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <Menu size={20} />
          </button>
          <Logo size="sm" />
        </div>

        <main style={{ flex: 1, padding: '2rem 1.75rem 4rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
