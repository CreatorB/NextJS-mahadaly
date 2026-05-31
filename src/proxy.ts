import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE = 'mahadaly_session'

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

export async function proxy(request: NextRequest) {
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
