import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail } from '@/types/api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['Kode Registrasi', 'kodeRegistrasi'],
  ['Tahun PSB', 'tahunPsb'],
  ['Nama Lengkap', 'nama'],
  ['NIK', 'nik'],
  ['Jenis Kelamin', 'jk'],
  ['Tempat Lahir', 'tmpLahir'],
  ['Tanggal Lahir', 'tglLahir'],
  ['No WA', 'noWa'],
  ['Email', 'email'],
  ['Alamat', 'alamat'],
  ['Provinsi', 'provinsi'],
  ['Kabupaten/Kota', 'kabupaten'],
  ['Kecamatan', 'kecamatan'],
  ['Desa', 'desa'],
  ['Kode Pos', 'kodePos'],
  ['Pendidikan Terakhir', 'pendidikan'],
  ['Pekerjaan', 'pekerjaan'],
  ['Program', 'program'],
  ['Nama Ayah', 'namaAyah'],
  ['No HP Ayah', 'noHpAyah'],
  ['Nama Ibu', 'namaIbu'],
  ['No HP Ibu', 'noHpIbu'],
  ['Nama Wali', 'namaWali'],
  ['No HP Wali', 'noHpWali'],
  ['Status Pendaftaran', 'statusPendaftaran'],
  ['Alasan Tolak Pendaftaran', 'alasanPendaftaran'],
  ['Status Transfer', 'statusTransfer'],
  ['Alasan Tolak Transfer', 'alasanTransfer'],
  ['Nominal Transfer', 'nominalTransfer'],
  ['Tgl Verifikasi', 'tglVerifikasi'],
  ['Pas Foto', 'photo'],
  ['KTP', 'ktp'],
  ['Ijazah', 'ijazah'],
  ['Bukti Transfer', 'transfer'],
  ['Tgl Daftar', 'createdAt'],
]

function escXml(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = v instanceof Date ? v.toISOString() : String(v)
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtDate(v: Date | null | undefined): string {
  if (!v) return ''
  try { return new Date(v).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) } catch { return '' }
}

function fmtMoney(v: unknown): string {
  if (v === null || v === undefined) return ''
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  if (!isFinite(n)) return ''
  return 'Rp ' + n.toLocaleString('id-ID')
}

function cellValue(
  s: Record<string, unknown>,
  k: string,
  lookups: {
    provinsi: Map<number, string>
    kabupaten: Map<number, string>
    kecamatan: Map<number, string>
    desa: Map<number, string>
  }
): string {
  switch (k) {
    case 'noWa': return '+' + (s.kodeNegara ?? '62') + (s.noHp ?? '')
    case 'tglLahir': return fmtDate(s.tglLahir as Date | null)
    case 'tglVerifikasi': return fmtDate(s.tglVerifikasi as Date | null)
    case 'createdAt': return fmtDate(s.createdAt as Date | null)
    case 'nominalTransfer': return fmtMoney(s.nominalTransfer)
    case 'provinsi': return s.provinsiId ? (lookups.provinsi.get(Number(s.provinsiId)) ?? '') : ''
    case 'kabupaten': return s.kabupatenId ? (lookups.kabupaten.get(Number(s.kabupatenId)) ?? '') : ''
    case 'kecamatan': return s.kecamatanId ? (lookups.kecamatan.get(Number(s.kecamatanId)) ?? '') : ''
    case 'desa': return s.desaId ? (lookups.desa.get(Number(s.desaId)) ?? '') : ''
    case 'pekerjaan': return (s.pekerjaan as { nama?: string } | null)?.nama ?? ''
    case 'program': return (s.program as { namaProgram?: string } | null)?.namaProgram ?? ''
    default: {
      const raw = s[k]
      if (raw === null || raw === undefined) return ''
      if (raw instanceof Date) return raw.toISOString()
      return String(raw)
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session || (session.roleId !== 1 && session.roleId !== 2)) {
      return Response.json(fail('Akses ditolak'), { status: 401 })
    }
    const rows = await prisma.santri.findMany({
      orderBy: { createdAt: 'desc' },
      include: { pekerjaan: true, program: true },
    })

    const provIds = Array.from(new Set(rows.map(r => r.provinsiId).filter((v): v is number => v != null)))
    const kabIds = Array.from(new Set(rows.map(r => r.kabupatenId).filter((v): v is number => v != null)))
    const kecIds = Array.from(new Set(rows.map(r => r.kecamatanId).filter((v): v is number => v != null)))
    const desaIds = Array.from(new Set(rows.map(r => r.desaId).filter((v): v is number => v != null)))

    const [provinsis, kabupatens, kecamatans, desas] = await Promise.all([
      provIds.length ? prisma.provinsi.findMany({ where: { id: { in: provIds } }, select: { id: true, nama: true } }) : [],
      kabIds.length ? prisma.kabupatenKota.findMany({ where: { id: { in: kabIds } }, select: { id: true, nama: true } }) : [],
      kecIds.length ? prisma.kecamatan.findMany({ where: { id: { in: kecIds } }, select: { id: true, nama: true } }) : [],
      desaIds.length ? prisma.desa.findMany({ where: { id: { in: desaIds } }, select: { id: true, nama: true } }) : [],
    ])

    const lookups = {
      provinsi: new Map(provinsis.map(p => [p.id, p.nama])),
      kabupaten: new Map(kabupatens.map(p => [p.id, p.nama])),
      kecamatan: new Map(kecamatans.map(p => [p.id, p.nama])),
      desa: new Map(desas.map(p => [p.id, p.nama])),
    }

    const headerRow = `<Row>${COLUMNS.map(c => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${escXml(c[0])}</Data></Cell>`).join('')}</Row>`
    const dataRows = rows.map(s => {
      const cells = COLUMNS.map(c => `<Cell><Data ss:Type="String">${escXml(cellValue(s as unknown as Record<string, unknown>, c[1], lookups))}</Data></Cell>`).join('')
      return `<Row>${cells}</Row>`
    }).join('')

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Data Santri">
    <Table>${headerRow}${dataRows}</Table>
  </Worksheet>
</Workbook>`

    const d = new Date()
    const fname = `data-santri-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.xls`
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fname}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
