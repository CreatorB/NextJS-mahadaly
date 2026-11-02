import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail, ok } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { bukaJson } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/riwayat?limit=&entitas=&pegawaiId=
 * Jejak audit perubahan data absensi (siapa mengubah apa, kapan).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const sp = req.nextUrl.searchParams
    const limit = Math.min(Number(sp.get('limit') ?? 100) || 100, 300)
    const entitas = sp.get('entitas') ?? undefined
    const pegawaiId = sp.get('pegawaiId') ? Number(sp.get('pegawaiId')) : undefined

    const daftar = await prisma.riwayatAbsensi.findMany({
      where: {
        ...(entitas ? { entitas } : {}),
        ...(Number.isFinite(pegawaiId) ? { pegawaiId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { pegawai: { select: { nama: true } } },
    })

    return Response.json(
      ok({
        riwayat: daftar.map((r) => ({
          id: r.id,
          aksi: r.aksi,
          entitas: r.entitas,
          entitasId: r.entitasId,
          pegawaiId: r.pegawaiId,
          namaPegawai: r.pegawai?.nama ?? null,
          sebelum: bukaJson(r.sebelum),
          sesudah: bukaJson(r.sesudah),
          keterangan: r.keterangan,
          actorNama: r.actorNama,
          createdAt: r.createdAt,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
