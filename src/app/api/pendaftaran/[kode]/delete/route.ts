import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { deleteDirectory } from '@/lib/upload'
import { ok, fail } from '@/types/api'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { kode } = await params
  const santri = await prisma.santri.findUnique({ where: { kodeRegistrasi: kode } })
  if (!santri) return Response.json(fail('Data tidak ditemukan'), { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { santriId: santri.id } })
    await tx.user.deleteMany({ where: { santriId: santri.id } })
    await tx.santri.delete({ where: { kodeRegistrasi: kode } })
  })

  await deleteDirectory(santri.tahunPsb, kode)

  return Response.json(ok(null, 'Data berhasil dihapus'))
}
