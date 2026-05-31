import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      santri: {
        include: { program: true, pekerjaan: true, notifications: { orderBy: { createdAt: 'desc' }, take: 10 } },
      },
    },
  })
  if (!user?.santri) return Response.json(fail('Data tidak ditemukan'), { status: 404 })

  const santri = user.santri
  const infoPsb = await prisma.infoPsb.findFirst({ where: { tahunAjaran: santri.tahunPsb } })

  return Response.json(ok({
    ...santri,
    linkGroup: santri.statusTransfer === 'approved' ? infoPsb?.linkGroup ?? null : null,
  }))
}
