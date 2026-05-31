import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(ok(users.map((u) => ({ ...u, password: undefined }))))
}

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const body = await req.json()
  const { nama, email, password, roleId } = body
  if (!nama || !email || !password || !roleId) return Response.json(fail('Data tidak lengkap'), { status: 400 })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return Response.json(fail('Email sudah terdaftar'), { status: 400 })
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { nama, email, password: hash, roleId: parseInt(roleId), isActive: true } })
  return Response.json(ok({ ...user, password: undefined }), { status: 201 })
}
