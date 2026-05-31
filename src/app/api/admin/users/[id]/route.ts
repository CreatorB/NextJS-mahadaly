import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.nama) data.nama = body.nama
  if (body.email) data.email = body.email
  if (body.password) data.password = await bcrypt.hash(body.password, 10)
  if (body.roleId) data.roleId = parseInt(body.roleId)
  if (body.isActive !== undefined) data.isActive = body.isActive
  const user = await prisma.user.update({ where: { id: parseInt(id) }, data })
  return Response.json(ok({ ...user, password: undefined }))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const { id } = await params
  await prisma.user.delete({ where: { id: parseInt(id) } })
  return Response.json(ok(null, 'User dihapus'))
}
