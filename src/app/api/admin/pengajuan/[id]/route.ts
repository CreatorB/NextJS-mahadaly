import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { catatRiwayat } from '@/lib/riwayat'
import { terapkanPengajuanDisetujui } from '@/lib/pengajuan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  aksi?: string
  alasan?: string
}

/**
 * PATCH /api/admin/pengajuan/[id]
 * aksi: setujui | tolak
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const { id } = await ctx.params
    const pengajuanId = Number(id)
    if (!Number.isFinite(pengajuanId)) {
      return Response.json(fail('Pengajuan tidak ditemukan.'), { status: 404 })
    }

    const pengajuan = await prisma.pengajuan.findUnique({ where: { id: pengajuanId } })
    if (!pengajuan) return Response.json(fail('Pengajuan tidak ditemukan.'), { status: 404 })
    if (pengajuan.status !== 'menunggu') {
      return Response.json(fail('Pengajuan sudah diproses.'), { status: 400 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const aksi = String(body.aksi ?? '')
    const alasan = String(body.alasan ?? '').trim()

    if (aksi === 'setujui') {
      const jumlah = await terapkanPengajuanDisetujui(pengajuan)
      await prisma.pengajuan.update({
        where: { id: pengajuanId },
        data: {
          status: 'disetujui',
          reviewedAt: new Date(),
          reviewedBy: session.userId,
          alasanVerifikasi: alasan || null,
        },
      })
      await catatRiwayat({
        aksi: 'setujui',
        entitas: 'pengajuan',
        entitasId: pengajuanId,
        pegawaiId: pengajuan.pegawaiId,
        sebelum: { status: 'menunggu' },
        sesudah: { status: 'disetujui', jumlahCatatan: jumlah },
        keterangan: alasan || null,
        actorId: session.userId,
        actorNama: session.nama,
      })
      return Response.json(
        ok({ jumlahCatatan: jumlah }, `Pengajuan disetujui, ${jumlah} catatan absensi dibuat.`),
      )
    }

    if (aksi === 'tolak') {
      if (!alasan) {
        return Response.json(fail('Tuliskan alasan penolakan.'), { status: 400 })
      }
      await prisma.pengajuan.update({
        where: { id: pengajuanId },
        data: {
          status: 'ditolak',
          reviewedAt: new Date(),
          reviewedBy: session.userId,
          alasanVerifikasi: alasan,
        },
      })
      await catatRiwayat({
        aksi: 'tolak',
        entitas: 'pengajuan',
        entitasId: pengajuanId,
        pegawaiId: pengajuan.pegawaiId,
        sebelum: { status: 'menunggu' },
        sesudah: { status: 'ditolak' },
        keterangan: alasan,
        actorId: session.userId,
        actorNama: session.nama,
      })
      return Response.json(ok({ id: pengajuanId }, 'Pengajuan ditolak.'))
    }

    return Response.json(fail('Aksi tidak dikenal.'), { status: 400 })
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat memproses pengajuan.'), { status: 500 })
  }
}
