import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { csvText, excelXml, downloadHeaders, exportFileName } from '@/lib/export'
import { jamPendek } from '@/lib/absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEADER = [
  'Kode',
  'Nama',
  'Jabatan',
  'No WhatsApp',
  'Email',
  'NIK',
  'Jenis Kelamin',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Pendidikan',
  'Status Pernikahan',
  'Alamat',
  'Tahun Bergabung',
  'Kontak Keluarga',
  'Jam Masuk',
  'Jam Pulang',
  'Toleransi (menit)',
  'Akun Login',
  'Status',
  'Hadir 30 hari',
  'Telat 30 hari',
]

function tgl(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

/**
 * GET /api/admin/pegawai/export?format=xls|csv
 * Ekspor master data pegawai (bisa dipakai juga sebagai template import).
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const format = (req.nextUrl.searchParams.get('format') ?? 'csv').toLowerCase()
  const sejak30Hari = new Date(Date.now() - 30 * 86400000)

  const pegawai = await prisma.pegawai.findMany({
    orderBy: [{ kode: 'asc' }, { nama: 'asc' }],
    include: {
      user: { select: { email: true } },
      absensi: {
        where: { tanggal: { gte: sejak30Hari } },
        select: { jamMasuk: true, status: true },
      },
    },
  })

  const data = pegawai.map((p) => [
    p.kode ?? '',
    p.nama,
    p.jabatan ?? '',
    p.noHp ?? '',
    p.email ?? '',
    p.nik ?? '',
    p.jk ?? '',
    p.tmpLahir ?? '',
    tgl(p.tglLahir),
    p.pendidikan ?? '',
    p.statusPernikahan ?? '',
    p.alamat ?? '',
    p.tahunBergabung ?? '',
    p.kontakKeluarga ?? '',
    jamPendek(p.jamMasuk),
    jamPendek(p.jamPulang),
    p.toleransiMenit != null ? String(p.toleransiMenit) : '',
    p.user?.email ?? '',
    p.isActive ? 'Aktif' : 'Nonaktif',
    String(p.absensi.filter((a) => a.jamMasuk).length),
    String(p.absensi.filter((a) => a.status === 'telat').length),
  ])

  if (format === 'xls') {
    const xml = excelXml('Data Pegawai', HEADER, data)
    return new Response(xml, {
      status: 200,
      headers: downloadHeaders(
        exportFileName('data-pegawai', 'xls'),
        'application/vnd.ms-excel; charset=utf-8',
      ),
    })
  }

  const csv = csvText(HEADER, data)
  return new Response(csv, {
    status: 200,
    headers: downloadHeaders(exportFileName('data-pegawai', 'csv'), 'text/csv; charset=utf-8'),
  })
}
