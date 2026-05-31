import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const programs = await prisma.program.findMany({ orderBy: { id: 'asc' } })
  return Response.json(ok(programs))
}

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId !== 1) return Response.json(fail('Unauthorized'), { status: 401 })
  const body = await req.json()
  const { namaProgram, statusPsb, keterangan } = body
  if (!namaProgram) return Response.json(fail('Nama program wajib diisi'), { status: 400 })
  const program = await prisma.program.create({ data: { namaProgram, statusPsb: statusPsb ?? 'Tutup', keterangan } })
  return Response.json(ok(program), { status: 201 })
}
