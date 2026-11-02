import { NextRequest } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'
import { ambilRekap } from '@/lib/rekap-absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/absen
 * Rekap absensi kerja. Query: dari, sampai, pegawaiId, status.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session || (session.roleId !== 1 && session.roleId !== 2)) {
      return Response.json(fail('Akses ditolak'), { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const pegawaiId = sp.get('pegawaiId') ? Number(sp.get('pegawaiId')) : undefined

    const { dari, sampai, rows, summary } = await ambilRekap({
      dari: sp.get('dari') ?? undefined,
      sampai: sp.get('sampai') ?? undefined,
      pegawaiId: Number.isFinite(pegawaiId) ? pegawaiId : undefined,
      status: sp.get('status') ?? undefined,
    })

    return Response.json(
      ok({
        dari: dari.toISOString().slice(0, 10),
        sampai: sampai.toISOString().slice(0, 10),
        summary,
        rows: rows.map((r) => ({
          id: r.id,
          tanggal: r.tanggal.toISOString().slice(0, 10),
          pegawaiId: r.pegawai.id,
          nama: r.pegawai.nama,
          jabatan: r.pegawai.jabatan,
          jamMasuk: r.jamMasuk ? r.jamMasuk.toISOString() : null,
          jamPulang: r.jamPulang ? r.jamPulang.toISOString() : null,
          metode: r.metode,
          jarakMeter: r.jarakMeter,
          status: r.status,
          keterangan: r.keterangan,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
