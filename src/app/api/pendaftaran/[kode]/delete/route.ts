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
  const siswa = await prisma.santri.findUnique({ where: { kodeRegistrasi: kode } })
  if (!siswa) return Response.json(fail('Data tidak ditemukan'), { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { siswaId: siswa.id } })
    await tx.user.deleteMany({ where: { siswaId: siswa.id } })
    await tx.santri.delete({ where: { kodeRegistrasi: kode } })
  })

  await deleteDirectory(siswa.tahunPsb, kode)

  return Response.json(ok(null, 'Pendaftaran berhasil dihapus'))
}