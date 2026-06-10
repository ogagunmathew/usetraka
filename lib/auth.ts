import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

export interface SessionUser {
  id: string
  email: string
  name: string
}

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(secret)
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get('session')?.value
  if (!token) return null
  return verifyToken(token)
}

export function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookie = [
    `session=${token}`,
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 30}`,
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
  ].filter(Boolean).join('; ')
  res.headers.set('Set-Cookie', cookie)
}
