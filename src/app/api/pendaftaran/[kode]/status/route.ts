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
  const { statusPendaftaran, statusTransfer, alasanPendaftaran, alasanTransfer } = body

  const updates: Record<string, string | null> = {}
  const notifications: { siswaId: string; type: string; title: string; message: string }[] = []

  if (statusPendaftaran !== undefined) {
    updates.statusPendaftaran = statusPendaftaran
    updates.alasanPendaftaran = statusPendaftaran === 'rejected' ? (alasanPendaftaran || null) : null
    if (statusPendaftaran === 'approved') {
      updates.tglVerifikasi = new Date()
      notifications.push({
        siswaId: siswa.id,
        type: 'approved',
        title: 'Pendaftaran Diterima',
        message: `Selamat ${siswa.nama}, pendaftaran Anda telah diterima. Silakan ikuti langkah selanjutnya.`,
      })
    } else if (statusPendaftaran === 'rejected') {
      updates.tglVerifikasi = new Date()
      notifications.push({
        siswaId: siswa.id,
        type: 'rejected',
        title: 'Pendaftaran Ditolak',
        message: alasanPendaftaran
          ? `Pendaftaran Anda ditolak. Alasan: ${alasanPendaftaran}. Jika ada berkas yang perlu diperbaiki, silakan kunjungi menu Dokumen Saya.`
          : 'Pendaftaran Anda ditolak oleh panitia. Jika ada berkas yang perlu diperbaiki, silakan kunjungi menu Dokumen Saya.',
      })
    }
  }

  if (statusTransfer !== undefined) {
    updates.statusTransfer = statusTransfer
    updates.alasanTransfer = statusTransfer === 'rejected' ? (alasanTransfer || null) : null
    if (statusTransfer === 'approved') {
      updates.tglVerifikasi = new Date()
      notifications.push({
        siswaId: siswa.id,
        type: 'info',
        title: 'Pembayaran Dikonfirmasi',
        message: 'Pembayaran Anda telah dikonfirmasi. Link grup WhatsApp kini tersedia di dashboard Anda.',
      })
    } else if (statusTransfer === 'rejected') {
      notifications.push({
        siswaId: siswa.id,
        type: 'rejected',
        title: 'Pembayaran Ditolak',
        message: `Bukti pembayaran Anda ditolak. Alasan: ${alasanTransfer}. Silakan upload ulang bukti transfer yang benar melalui menu Dokumen Saya.`,
      })
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(fail('Tidak ada status yang diubah'), { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.santri.update({
      where: { kodeRegistrasi: kode },
      data: updates,
    })
    for (const notif of notifications) {
      await tx.notification.create({ data: notif })
    }
  })

  return Response.json(ok(null, 'Status berhasil diperbarui'))
}