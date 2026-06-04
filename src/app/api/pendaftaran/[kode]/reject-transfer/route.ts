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
  const siswa = await prisma.santri.findUnique({ where: { kodeRegistrasi: kode } })
  if (!siswa) return Response.json(fail('Data tidak ditemukan'), { status: 404 })

  const body = await req.json().catch(() => ({}))
  const alasan: string = body.alasan ?? ''
  if (!alasan.trim()) return Response.json(fail('Alasan penolakan wajib diisi'), { status: 400 })

  await prisma.$transaction(async (tx) => {
    await tx.santri.update({
      where: { kodeRegistrasi: kode },
      data: { statusTransfer: 'rejected', alasanTransfer: alasan },
    })
    await tx.notification.create({
      data: {
        siswaId: siswa.id,
        type: 'rejected',
        title: 'Pembayaran Ditolak',
        message: `Bukti pembayaran Anda ditolak. Alasan: ${alasan}. Silakan upload ulang bukti transfer yang benar melalui menu Dokumen Saya.`,
      },
    })
  })

  return Response.json(ok(null, 'Transfer ditolak'))
}