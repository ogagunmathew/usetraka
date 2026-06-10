import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/signup', '/verify', '/pricing', '/api/auth', '/api/health', '/api/cron', '/api/payments/callback', '/api/payments/webhook']

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || '')
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Landing page is public — but send authenticated users straight to the app
  if (pathname === '/') {
    if (process.env.JWT_SECRET) {
      const token = request.cookies.get('session')?.value
      if (token) {
        try {
          await jwtVerify(token, getSecret())
          return NextResponse.redirect(new URL('/app', request.url))
        } catch {
          // invalid token — fall through and show landing page
        }
      }
    }
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // If JWT_SECRET not configured, allow through (dev without auth set up)
  if (!process.env.JWT_SECRET) return NextResponse.next()

  const token = request.cookies.get('session')?.value

  if (token) {
    try {
      await jwtVerify(token, getSecret())
      return NextResponse.next()
    } catch {
      // Token invalid or expired — fall through to redirect
    }
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$).*)'],
}
