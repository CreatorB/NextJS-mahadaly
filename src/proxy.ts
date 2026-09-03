import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE = 'mahadaly_session'

const STAGING_KEY = 'bismillah'
const STAGING_COOKIE = 'staging_key'
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false

async function getRole(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload as { roleId: number }).roleId ?? null
  } catch {
    return null
  }
}

function checkStagingKey(req: NextRequest): NextResponse | null {
  if (!isStaging) return null
  const key = req.nextUrl.searchParams.get('key')
  const cookie = req.cookies.get(STAGING_COOKIE)?.value
  if (key === STAGING_KEY || cookie === STAGING_KEY) {
    if (key === STAGING_KEY) {
      const response = NextResponse.next()
      response.cookies.set(STAGING_COOKIE, STAGING_KEY, {
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        path: '/',
      })
      return response
    }
    return NextResponse.next()
  }
  return new NextResponse(
    `Akses ditolak. Buka https://tesmahadaly.syathiby.id/?key=${STAGING_KEY}`,
    { status: 401, headers: { 'Content-Type': 'text/plain' } }
  )
}

export async function proxy(request: NextRequest) {
  const keyGate = checkStagingKey(request)
  if (keyGate) return keyGate

  const { pathname } = request.nextUrl
  const role = await getRole(request)

  if (pathname.startsWith('/dashboard')) {
    if (!role) return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin/superadmin')) {
    if (!role) return NextResponse.redirect(new URL('/login', request.url))
    if (role !== 1) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  } else if (pathname.startsWith('/admin')) {
    if (!role) return NextResponse.redirect(new URL('/login', request.url))
    if (role > 2) return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && role) {
    if (role <= 2) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}