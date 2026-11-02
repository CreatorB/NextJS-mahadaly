import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { LABEL_JENIS } from '@/lib/pengajuan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/pengajuan — daftar pengajuan izin / sakit / cuti.
 * Query: status (menunggu|disetujui|ditolak|dibatalkan, default 'menunggu').
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const sp = req.nextUrl.searchParams
    const status = sp.get('status') ?? 'menunggu'

    const daftar = await prisma.pengajuan.findMany({
      where: status === 'semua' ? {} : { status },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
      include: {
        pegawai: {
          select: { id: true, nama: true, jabatan: true, noHp: true, userId: true },
        },
      },
    })

    const pending = await prisma.pengajuan.count({ where: { status: 'menunggu' } })

    return Response.json(
      ok({
        totalPending: pending,
        pengajuan: daftar.map((p) => ({
          id: p.id,
          pegawaiId: p.pegawaiId,
          nama: p.pegawai.nama,
          jabatan: p.pegawai.jabatan,
          noHp: p.pegawai.noHp,
          jenis: p.jenis,
          labelJenis: LABEL_JENIS[p.jenis] ?? p.jenis,
          tanggalMulai: p.tanggalMulai.toISOString().slice(0, 10),
          tanggalSelesai: p.tanggalSelesai.toISOString().slice(0, 10),
          keterangan: p.keterangan,
          buktiUrl: p.buktiUrl,
          status: p.status,
          alasanVerifikasi: p.alasanVerifikasi,
          reviewedAt: p.reviewedAt,
          createdAt: p.createdAt,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
