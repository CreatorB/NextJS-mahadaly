import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { kode } = await params
  const santri = await prisma.santri.findUnique({
    where: { kodeRegistrasi: kode },
    include: { program: true, pekerjaan: true, notifications: { orderBy: { createdAt: 'desc' } } },
  })
  if (!santri) return Response.json(fail('Data tidak ditemukan'), { status: 404 })
  return Response.json(ok(santri))
}
