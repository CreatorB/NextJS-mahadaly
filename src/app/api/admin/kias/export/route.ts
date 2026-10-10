import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail } from '@/types/api'
import { KIAS_VCF_CODE, kiasFilterFromParams, kiasWhere, requireAdminApi } from '@/lib/kias-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Awaited<ReturnType<typeof load>>[number]

async function load(req: NextRequest) {
  const filter = kiasFilterFromParams(req.nextUrl.searchParams)
  return prisma.kiasSantri.findMany({
    where: kiasWhere(filter),
    orderBy: { createdAt: 'desc' },
    include: { program: { include: { jenisProgram: true } } },
  })
}

const tgl = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')
const tglJam = (d: Date | null) => (d ? d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '')

const COLUMNS: [string, (r: Row) => string | number][] = [
  ['Kode Registrasi', (r) => r.kodeRegistrasi],
  ['Tahun PSB', (r) => r.tahunPsb],
  ['Nama Lengkap', (r) => r.nama],
  ['NIK', (r) => r.nik ?? ''],
  ['NISN', (r) => r.nisn ?? ''],
  ['Jenis Kelamin', (r) => r.jk],
  ['Tempat Lahir', (r) => r.tmpLahir ?? ''],
  ['Tanggal Lahir', (r) => tgl(r.tglLahir)],
  ['No WA', (r) => (r.hp ? `+${r.hp}` : '')],
  ['Email', (r) => r.email ?? ''],
  ['Alamat', (r) => r.alamat ?? ''],
  ['Pendidikan Terakhir', (r) => r.pendidikan ?? ''],
  ['Pekerjaan', (r) => r.pekerjaan ?? ''],
  ['Jenjang', (r) => r.program?.jenisProgram.namaJenis ?? ''],
  ['Kelas', (r) => r.program?.namaProgram ?? ''],
  ['Nama Ayah', (r) => r.namaAyah ?? ''],
  ['No HP Ayah', (r) => r.noHpAyah ?? ''],
  ['Nama Ibu', (r) => r.namaIbu ?? ''],
  ['No HP Ibu', (r) => r.noHpIbu ?? ''],
  ['Nama Wali', (r) => r.namaWali ?? ''],
  ['No HP Wali', (r) => r.noHpWali ?? ''],
  ['Status Pendaftaran', (r) => r.statusPendaftaran],
  ['Status Transfer', (r) => r.statusTransfer],
  ['Alasan', (r) => r.alasanPenolakan ?? ''],
  ['Nominal Transfer', (r) => r.nominalTransfer],
  ['Tgl Verifikasi', (r) => tglJam(r.tglVerifikasi)],
  ['Status Santri', (r) => r.status],
  ['Tgl Daftar', (r) => tglJam(r.createdAt)],
]

function csv(rows: Row[]) {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [COLUMNS.map(([h]) => h).join(','), ...rows.map((r) => COLUMNS.map(([, f]) => esc(f(r))).join(','))]
  return '\uFEFF' + lines.join('\r\n')
}

/** SpreadsheetML (dibuka langsung oleh Excel / LibreOffice), sama dengan ekspor santri HKI. */
function excel(rows: Row[]) {
  const x = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const cell = (v: string | number, style = '') =>
    `<Cell${style}><Data ss:Type="${typeof v === 'number' ? 'Number' : 'String'}">${x(v)}</Data></Cell>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#00367C" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Santri KIAS"><Table>
<Row>${COLUMNS.map(([h]) => cell(h, ' ss:StyleID="h"')).join('')}</Row>
${rows.map((r) => `<Row>${COLUMNS.map(([, f]) => cell(f(r))).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`
}

function vcf(rows: Row[]) {
  const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '').replace(/,/g, '\\,').replace(/;/g, '\\;')
  return rows
    .map((s) => {
      const code = (s.program && KIAS_VCF_CODE[s.program.jenisProgramId]) || 'Kias'
      const thn = s.tahunPsb.slice(2, 4) || String(new Date().getFullYear()).slice(-2)
      const g = s.jk === 'Laki-Laki' ? 'L' : s.jk === 'Perempuan' ? 'P' : 'X'
      const name = `${code}${thn}${g} ${s.nama}`
      const lines = [
        'BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(name)}`, `N:${esc(name)};;;;`, `ORG:${esc(code + thn)}`,
        `NICKNAME:${esc(`${(s.program?.namaProgram ?? 'Santri').split(' ')[0]} [${s.kodeRegistrasi}]`)}`,
      ]
      if (s.tglLahir) lines.push(`BDAY:${tgl(s.tglLahir).replace(/-/g, '')}`)
      if (s.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(s.email)}`)
      if (s.hp) lines.push(`TEL;TYPE=CELL:+${s.hp.replace(/^\+/, '')}`)
      for (const hp of [s.noHpAyah, s.noHpIbu, s.noHpWali]) if (hp) lines.push(`TEL;TYPE=CELL:${esc(hp)}`)
      if (s.namaAyah) lines.push(`X-ayah:${esc(s.namaAyah)}`)
      if (s.namaIbu) lines.push(`X-ibu:${esc(s.namaIbu)}`)
      if (s.namaWali) lines.push(`X-wali:${esc(s.namaWali)}`)
      lines.push('END:VCARD')
      return lines.join('\r\n')
    })
    .join('\r\n') + '\r\n'
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })
  const format = req.nextUrl.searchParams.get('format') ?? 'csv'
  const rows = await load(req)
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const tahun = (req.nextUrl.searchParams.get('tahun') ?? 'semua').replace(/[^0-9A-Za-z-]/g, '')

  const out =
    format === 'xls'
      ? { body: excel(rows), type: 'application/vnd.ms-excel; charset=utf-8', name: `santri-kias-${tahun}-${stamp}.xls` }
      : format === 'vcf'
        ? { body: vcf(rows), type: 'text/x-vcard; charset=utf-8', name: `Santri_KIAS_${stamp}.vcf` }
        : { body: csv(rows), type: 'text/csv; charset=utf-8', name: `santri-kias-${tahun}-${stamp}.csv` }

  return new Response(out.body, {
    headers: { 'Content-Type': out.type, 'Content-Disposition': `attachment; filename="${out.name}"`, 'Cache-Control': 'no-store' },
  })
}
