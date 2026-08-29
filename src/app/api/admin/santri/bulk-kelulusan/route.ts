import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import {
  KELULUSAN_CATATAN_TEMPLATE,
  PREDIKAT_LULUS_DENGAN_CATATAN,
  normalizeNama,
} from '@/lib/kelulusan-template'

export const dynamic = 'force-dynamic'

interface CsvRow {
  no: string
  nama: string
  jk: string
  hasil: string
  predikat: string
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length)
  if (lines.length < 6) return []
  const dataLines = lines.slice(6)
  const rows: CsvRow[] = []
  for (const line of dataLines) {
    const cols = line.split(',').map((c) => c.trim())
    if (cols.length < 5) continue
    const no = cols[0]
    const nama = cols[1]
    const jk = cols[2]
    const hasil = cols[3]
    const predikat = cols[6] ?? ''
    if (!no || !nama) continue
    rows.push({ no, nama, jk, hasil, predikat })
  }
  return rows
}

/**
 * Parse SpreadsheetML 2003 XML (application/vnd.ms-excel) used by the
 * download endpoint. Minimal parser — assumes single worksheet, reads cells
 * in row-major order, extracts text from <Data> inside <Cell>.
 */
function parseXls(xml: string): string[][] {
  const rows: string[][] = []
  const rowRe = /<Row\b[^>]*>([\s\S]*?)<\/Row>/g
  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const rowXml = rowMatch[1]
    const cells: string[] = []
    const cellRe = /<Cell\b[^>]*>([\s\S]*?)<\/Cell>/g
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRe.exec(rowXml)) !== null) {
      const dataMatch = /<Data[^>]*>([\s\S]*?)<\/Data>/.exec(cellMatch[1])
      cells.push(dataMatch ? dataMatch[1].trim() : '')
    }
    rows.push(cells)
  }
  return rows
}

function parseXlsRows(xml: string): CsvRow[] {
  const rows = parseXls(xml)
  if (rows.length < 2) return []
  const header = rows[0].map((c) => c.toLowerCase())
  const idx = (name: string) => header.findIndex((h) => h.includes(name))
  const iNama = idx('nama')
  const iJk = idx('jenis kelamin')
  const iHasil = idx('hasil')
  const iPredikat = idx('predikat')
  if (iNama < 0 || iHasil < 0) return []
  const out: CsvRow[] = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const nama = row[iNama]?.trim()
    if (!nama) continue
    out.push({
      no: String(r),
      nama,
      jk: row[iJk]?.trim() ?? '',
      hasil: row[iHasil]?.trim() ?? '',
      predikat: iPredikat >= 0 ? row[iPredikat]?.trim() ?? '' : '',
    })
  }
  return out
}

function detectFormat(filename: string, contentType: string): 'csv' | 'xls' | 'unknown' {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.csv') || contentType.includes('text/csv')) return 'csv'
  if (
    lower.endsWith('.xls') ||
    lower.endsWith('.xlsx') ||
    contentType.includes('excel') ||
    contentType.includes('spreadsheetml')
  ) {
    return 'xls'
  }
  return 'unknown'
}

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json(fail('File CSV/XLS wajib diupload'), { status: 400 })
  }

  const text = await file.text()
  const fmt = detectFormat(file.name, file.type)
  let rows: CsvRow[] = []
  if (fmt === 'csv') {
    rows = parseCsv(text)
  } else if (fmt === 'xls') {
    rows = parseXlsRows(text)
  } else {
    return Response.json(fail('Format file tidak dikenali (pakai .csv atau .xls)'), { status: 400 })
  }

  if (rows.length === 0) {
    return Response.json(fail('File kosong atau kolom Nama / Hasil Tes tidak ditemukan'), { status: 400 })
  }

  const allSantri = await prisma.santri.findMany({ select: { id: true, nama: true } })
  const byNormalizedName = new Map<string, { id: number; nama: string }>()
  for (const s of allSantri) {
    byNormalizedName.set(normalizeNama(s.nama), { id: s.id, nama: s.nama })
  }

  const matched: Array<{ csv: CsvRow; siswa: { id: number; nama: string } }> = []
  const unmatched: string[] = []
  for (const row of rows) {
    const key = normalizeNama(row.nama)
    const found = byNormalizedName.get(key)
    if (found) matched.push({ csv: row, siswa: found })
    else unmatched.push(row.nama)
  }

  const now = new Date()
  let updated = 0
  const failed: string[] = []

  for (const { csv, siswa } of matched) {
    const lulus = csv.hasil.toUpperCase().includes('LULUS')
    const predikatRaw = csv.predikat.trim()
    const isCatatan = normalizeNama(predikatRaw) === normalizeNama(PREDIKAT_LULUS_DENGAN_CATATAN)
    const catatan = isCatatan ? KELULUSAN_CATATAN_TEMPLATE : null

    try {
      await prisma.santri.update({
        where: { id: siswa.id },
        data: {
          statusPendaftaran: 'approved',
          statusTransfer: 'approved',
          tglVerifikasi: now,
          kelulusan: lulus ? 'lulus' : 'tidak_lulus',
          predikat: predikatRaw || null,
          catatan,
          kelulusanAt: now,
        },
      })
      updated++
    } catch (e) {
      console.error('[bulk-kelulusan] failed to update', siswa.id, e)
      failed.push(siswa.nama)
    }
  }

  return Response.json(
    ok({
      totalRows: rows.length,
      matched: matched.length,
      updated,
      unmatched,
      failed,
    }),
  )
}
