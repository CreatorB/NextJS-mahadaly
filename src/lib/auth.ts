import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

const COOKIE_NAME = 'mahadaly_session'
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export interface JWTPayload {
  userId: number
  roleId: number
  email: string
  nama: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/**
 * Sesi dianggap kedaluwarsa bila:
 * - akun dinonaktifkan admin, atau
 * - password diganti (reset password) AFTER token sesi diterbitkan.
 *Efeknya: reset password langsung memaksa user login ulang di perangkat lama.
 */
export async function isSessionStale(payload: JWTPayload): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { passwordChangedAt: true, isActive: true },
    })
    if (!user) return true
    if (user.isActive === false) return true
    const iat = (payload as unknown as { iat?: number }).iat
    if (user.passwordChangedAt && iat) {
      return user.passwordChangedAt.getTime() > iat * 1000
    }
    return false
  } catch {
    // Jangan matikan sesi hanya karena DB sedang tidak bisa diakses.
    return false
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  if (await isSessionStale(payload)) return null
  return payload
}

export async function setSession(payload: JWTPayload): Promise<void> {
  const token = await signToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie')
  if (!cookie) return null
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

export async function verifyTokenFromRequest(req: Request): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  if (await isSessionStale(payload)) return null
  return payload
}
