import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail } from '@/types/api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['Kode Registrasi', 'kodeRegistrasi'],
  ['Nama Lengkap', 'nama'],
  ['Jenis Kelamin', 'jk'],
  ['Program', 'program'],
  ['Tahun PSB', 'tahunPsb'],
  ['Status Pendaftaran', 'statusPendaftaran'],
  ['Status Transfer', 'statusTransfer'],
  ['Hasil Tes', 'kelulusan'],
  ['Predikat', 'predikat'],
  ['Catatan', 'catatan'],
  ['Tgl Verifikasi', 'tglVerifikasi'],
]

function escXml(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = v instanceof Date ? v.toISOString() : String(v)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(v: Date | null | undefined): string {
  if (!v) return ''
  try {
    return new Date(v).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return ''
  }
}

function labelKelulusan(v: string | null): string {
  if (v === 'lulus') return 'LULUS'
  if (v === 'tidak_lulus') return 'TIDAK LULUS'
  return ''
}

function cellValue(s: Record<string, unknown>, k: string): string {
  switch (k) {
    case 'program':
      return (s.program as { namaProgram?: string } | null)?.namaProgram ?? ''
    case 'tglVerifikasi':
      return fmtDate(s.tglVerifikasi as Date | null)
    case 'kelulusan':
      return labelKelulusan(s.kelulusan as string | null)
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
      include: { program: true },
    })

    const headerRow = `<Row>${COLUMNS.map((c) => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${escXml(c[0])}</Data></Cell>`).join('')}</Row>`
    const dataRows = rows
      .map((s) => {
        const cells = COLUMNS.map(
          (c) => `<Cell><Data ss:Type="String">${escXml(cellValue(s as unknown as Record<string, unknown>, c[1]))}</Data></Cell>`,
        ).join('')
        return `<Row>${cells}</Row>`
      })
      .join('')

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Kelulusan">
    <Table>${headerRow}${dataRows}</Table>
  </Worksheet>
</Workbook>`

    const d = new Date()
    const fname = `data-kelulusan-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.xls`
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
