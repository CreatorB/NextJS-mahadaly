import { NextRequest } from 'next/server'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { csvText, excelXml, downloadHeaders, exportFileName } from '@/lib/export'
import { rekapBulanan } from '@/lib/rekap-absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEADER = [
  'Nama Pegawai',
  'Jabatan',
  'Hari Kerja',
  'Hadir',
  'Telat',
  'Izin',
  'Sakit',
  'Cuti',
  'Alpa',
  'Hari Efektif',
  'Persen Kehadiran',
  'Total Menit Telat',
  'Total Jam Kerja',
  'Lembur (jam)',
  'Belum Pulang',
]

/**
 * GET /api/admin/absen/bulanan?bulan=YYYY-MM&format=xls|csv&pegawaiId=
 * Rekap bulanan per pegawai (dasar penggajian / evaluasi).
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const bulan = sp.get('bulan') ?? ''
  const format = (sp.get('format') ?? '').toLowerCase()
  const pegawaiId = sp.get('pegawaiId') ? Number(sp.get('pegawaiId')) : undefined

  const rekap = await rekapBulanan({
    bulan,
    pegawaiId: Number.isFinite(pegawaiId) ? pegawaiId : undefined,
  })

  if (format === 'xls' || format === 'csv') {
    const data = rekap.rows.map((r) => [
      r.nama,
      r.jabatan ?? '',
      String(r.hariKerja),
      String(r.hadir),
      String(r.telat),
      String(r.izin),
      String(r.sakit),
      String(r.cuti),
      String(r.alpa),
      String(r.hariEfektif),
      `${r.persenKehadiran}%`,
      String(r.menitTelat),
      String(r.totalJamKerja),
      String(r.lemburJam),
      String(r.belumPulang),
    ])

    if (format === 'xls') {
      const xml = excelXml(`Rekap Bulanan ${rekap.bulan}`, HEADER, data)
      return new Response(xml, {
        status: 200,
        headers: downloadHeaders(
          exportFileName(`rekap-bulanan-${rekap.bulan}`, 'xls'),
          'application/vnd.ms-excel; charset=utf-8',
        ),
      })
    }

    const csv = csvText(HEADER, data)
    return new Response(csv, {
      status: 200,
      headers: downloadHeaders(
        exportFileName(`rekap-bulanan-${rekap.bulan}`, 'csv'),
        'text/csv; charset=utf-8',
      ),
    })
  }

  return Response.json({
    success: true,
    data: {
      bulan: rekap.bulan,
      dari: rekap.dari.toISOString().slice(0, 10),
      sampai: rekap.sampai.toISOString().slice(0, 10),
      hariKerja: rekap.hariKerja,
      rows: rekap.rows,
    },
  })
}
