import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const { id } = await params
  const body = await req.json()
  const program = await prisma.program.update({
    where: { id: parseInt(id) },
    data: { namaProgram: body.namaProgram, statusPsb: body.statusPsb, keterangan: body.keterangan },
  })
  return Response.json(ok(program))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const { id } = await params
  await prisma.program.delete({ where: { id: parseInt(id) } })
  return Response.json(ok(null, 'Program dihapus'))
}
