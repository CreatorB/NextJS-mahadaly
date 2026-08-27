import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { setSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { ok, fail } from '@/types/api'

export async function POST(req: NextRequest) {
  console.log('[POST /api/auth/login] Request received')
  try {
    const body = await req.json()
    console.log('[POST /api/auth/login] Body parsed', { email: body?.email, hasPassword: !!body?.password })

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      console.warn('[POST /api/auth/login] Validation failed', parsed.error.issues)
      return Response.json(fail('Data tidak valid', Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), [i.message]]))), { status: 400 })
    }

    const { email, password } = parsed.data
    console.log('[POST /api/auth/login] Looking up user', email)

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user) {
      console.warn('[POST /api/auth/login] User not found', email)
      return Response.json(fail('Email atau password salah'), { status: 401 })
    }
    console.log('[POST /api/auth/login] User found', { id: user.id, email: user.email, isActive: user.isActive, roleId: user.roleId })

    if (!user.isActive) {
      console.warn('[POST /api/auth/login] User not active', email)
      return Response.json(fail('Akun tidak aktif, hubungi admin'), { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    console.log('[POST /api/auth/login] Password valid', valid)

    if (!valid) {
      console.warn('[POST /api/auth/login] Wrong password for', email)
      return Response.json(fail('Email atau password salah'), { status: 401 })
    }

    await setSession({ userId: user.id, roleId: user.roleId, email: user.email, nama: user.nama })
    console.log('[POST /api/auth/login] Session set for', email)
    return Response.json(ok({ roleId: user.roleId, nama: user.nama, email: user.email }))
  } catch (e) {
    console.error('[POST /api/auth/login] Error:', e)
    return Response.json(fail('Terjadi kesalahan server: ' + (e instanceof Error ? e.message : String(e))), { status: 500 })
  }
}
