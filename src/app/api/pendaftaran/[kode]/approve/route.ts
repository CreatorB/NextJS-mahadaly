import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { kode } = await params
  const santri = await prisma.santri.findUnique({ where: { kodeRegistrasi: kode } })
  if (!santri) return Response.json(fail('Data tidak ditemukan'), { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.santri.update({
      where: { kodeRegistrasi: kode },
      data: { statusPendaftaran: 'approved', tglVerifikasi: new Date(), alasanPendaftaran: null },
    })
    await tx.notification.create({
      data: {
        santriId: santri.id,
        type: 'approved',
        title: 'Pendaftaran Diterima',
        message: `Selamat ${santri.nama}, pendaftaran Anda telah diterima. Silakan ikuti langkah selanjutnya.`,
      },
    })
  })

  return Response.json(ok(null, 'Pendaftaran berhasil diterima'))
}
