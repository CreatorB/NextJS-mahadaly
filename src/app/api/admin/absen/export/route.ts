import { NextRequest } from 'next/server'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { csvText, excelXml, downloadHeaders, exportFileName } from '@/lib/export'
import { ambilRekap } from '@/lib/rekap-absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEADER = [
  'Tanggal',
  'Nama Pegawai',
  'Jabatan',
  'Jam Masuk',
  'Jam Pulang',
  'Durasi Kerja (jam)',
  'Metode',
  'Jarak (meter)',
  'Status',
  'Keterangan',
]

const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  telat: 'Telat',
  izin: 'Izin',
  sakit: 'Sakit',
  alpa: 'Alpa',
}

function jamWib(d: Date | null): string {
  if (!d) return ''
  return new Date(d.getTime() + 7 * 3600000).toISOString().slice(11, 16)
}

function tanggalWib(d: Date): string {
  return new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10)
}

function durasiJam(masuk: Date | null, pulang: Date | null): string {
  if (!masuk || !pulang) return ''
  const jam = (pulang.getTime() - masuk.getTime()) / 3600000
  return jam.toFixed(2)
}

/**
 * GET /api/admin/absen/export?format=xls|csv&dari=&sampai=&pegawaiId=&status=
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const format = (sp.get('format') ?? 'csv').toLowerCase()
  const pegawaiId = sp.get('pegawaiId') ? Number(sp.get('pegawaiId')) : undefined

  const { rows } = await ambilRekap({
    dari: sp.get('dari') ?? undefined,
    sampai: sp.get('sampai') ?? undefined,
    pegawaiId: Number.isFinite(pegawaiId) ? pegawaiId : undefined,
    status: sp.get('status') ?? undefined,
  })

  const data = rows.map((r) => [
    tanggalWib(r.tanggal),
    r.pegawai.nama,
    r.pegawai.jabatan ?? '',
    jamWib(r.jamMasuk),
    jamWib(r.jamPulang),
    durasiJam(r.jamMasuk, r.jamPulang),
    r.metode === 'wifi' ? 'Wi-Fi' : r.metode === 'gps' ? 'GPS' : '',
    r.jarakMeter != null ? String(r.jarakMeter) : '',
    STATUS_LABEL[r.status] ?? r.status,
    r.keterangan ?? '',
  ])

  if (format === 'xls') {
    const xml = excelXml('Rekap Absensi Kerja', HEADER, data)
    return new Response(xml, {
      status: 200,
      headers: downloadHeaders(
        exportFileName('rekap-absensi-kerja', 'xls'),
        'application/vnd.ms-excel; charset=utf-8',
      ),
    })
  }

  const csv = csvText(HEADER, data)
  return new Response(csv, {
    status: 200,
    headers: downloadHeaders(
      exportFileName('rekap-absensi-kerja', 'csv'),
      'text/csv; charset=utf-8',
    ),
  })
}
