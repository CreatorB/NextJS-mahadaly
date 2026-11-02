import { NextRequest } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'
import { ambilRekap } from '@/lib/rekap-absensi'
import { simpanAlpaOtomatis } from '@/lib/pengajuan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/absen
 * Rekap absensi kerja. Query: dari, sampai, pegawaiId, status, tanpaAbsen=1.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session || (session.roleId !== 1 && session.roleId !== 2)) {
      return Response.json(fail('Akses ditolak'), { status: 401 })
    }

    // Simpan otomatis catatan alpa untuk hari yang lewat tanpa keterangan
    // (hanya aktif bila pengaturan autoSimpanAlpa menyala).
    const alpaOtomatis = await simpanAlpaOtomatis()

    const sp = req.nextUrl.searchParams
    const pegawaiId = sp.get('pegawaiId') ? Number(sp.get('pegawaiId')) : undefined
    const includeTanpaAbsen = sp.get('tanpaAbsen') === '1'

    const { dari, sampai, rows, summary, perPegawai, tanpaAbsen } = await ambilRekap({
      dari: sp.get('dari') ?? undefined,
      sampai: sp.get('sampai') ?? undefined,
      pegawaiId: Number.isFinite(pegawaiId) ? pegawaiId : undefined,
      status: sp.get('status') ?? undefined,
      includeTanpaAbsen,
    })

    return Response.json(
      ok({
        dari: dari.toISOString().slice(0, 10),
        sampai: sampai.toISOString().slice(0, 10),
        summary: { ...summary, alpaOtomatis },
        perPegawai,
        rows: rows.map((r) => ({
          id: r.id,
          tanggal: r.tanggal.toISOString().slice(0, 10),
          pegawaiId: r.pegawaiId,
          nama: r.pegawai.nama,
          jabatan: r.pegawai.jabatan,
          jamMasuk: r.jamMasuk ? r.jamMasuk.toISOString() : null,
          jamPulang: r.jamPulang ? r.jamPulang.toISOString() : null,
          metode: r.metode,
          jarakMeter: r.jarakMeter,
          status: r.status,
          keterangan: r.keterangan,
          sumber: r.sumber,
          menitTelat: r.menitTelat,
          lemburMenit: r.lemburMenit,
          durasiKerja: r.durasiKerja,
          jamKerjaMasuk: r.jamKerja.jamMasuk,
          jamKerjaPulang: r.jamKerja.jamPulang,
        })),
        tanpaAbsen: includeTanpaAbsen
          ? tanpaAbsen.map((t) => ({
              ...t,
              tanggal: (t.tanggal as Date).toISOString().slice(0, 10),
            }))
          : [],
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
