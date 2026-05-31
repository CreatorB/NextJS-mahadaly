import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 15
  const skip = (page - 1) * limit
  const search = searchParams.get('search') ?? ''
  const statusPendaftaran = searchParams.get('statusPendaftaran') ?? ''
  const statusTransfer = searchParams.get('statusTransfer') ?? ''
  const programId = searchParams.get('programId')
  const jk = searchParams.get('jk') ?? ''
  const tahun = searchParams.get('tahun') ?? ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { kodeRegistrasi: { contains: search } },
    ]
  }
  if (statusPendaftaran) where.statusPendaftaran = statusPendaftaran
  if (statusTransfer) where.statusTransfer = statusTransfer
  if (programId) where.programId = parseInt(programId)
  if (jk) where.jk = jk
  if (tahun) where.tahunPsb = tahun

  const [total, data] = await Promise.all([
    prisma.santri.count({ where }),
    prisma.santri.findMany({
      where,
      include: { program: true, pekerjaan: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return Response.json(ok({ data, total, page, totalPages: Math.ceil(total / limit) }))
}
