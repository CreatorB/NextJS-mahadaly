import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { ok, fail } from '@/types/api'

const COOKIE_NAME = 'mahadaly_session'

export async function POST(req: NextRequest) {
  try {
    // Parse body — handle non-JSON gracefully
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(fail('Data tidak valid - body harus JSON'), { status: 400 })
    }

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail('Data tidak valid', Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), [i.message]]))), { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user || !user.isActive) {
      return NextResponse.json(fail('Email atau password salah'), { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(fail('Email atau password salah'), { status: 401 })
    }

    // Create JWT token
    const token = await signToken({ userId: user.id, roleId: user.roleId, email: user.email, nama: user.nama })

    // Set cookie explicitly via NextResponse
    const response = NextResponse.json(ok({ roleId: user.roleId, nama: user.nama, email: user.email }))
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (e) {
    // Log full error in dev, generic in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('[POST /api/auth/login]', e)
      return NextResponse.json(fail('Terjadi kesalahan server: ' + (e instanceof Error ? e.message : String(e))), { status: 500 })
    }
    console.error('[POST /api/auth/login]', e?.message ?? e)
    return NextResponse.json(fail('Terjadi kesalahan server'), { status: 500 })
  }
}
