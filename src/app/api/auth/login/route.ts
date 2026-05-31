import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { setSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { ok, fail } from '@/types/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(fail('Data tidak valid'), { status: 400 })
    }
    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user || !user.isActive) {
      return Response.json(fail('Email atau password salah'), { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return Response.json(fail('Email atau password salah'), { status: 401 })
    }
    await setSession({ userId: user.id, roleId: user.roleId, email: user.email, nama: user.nama })
    return Response.json(ok({ roleId: user.roleId, nama: user.nama }))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
