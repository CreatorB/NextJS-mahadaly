/**
 * Helper export data admin (panel Mahad Aly).
 *
 * - `excelXml()`  → SpreadsheetML (.xls) tanpa dependency eksternal
 * - `csvText()`   → CSV dengan BOM (biar Excel Indonesia langsung rapi)
 * - `vcfText()`   → vCard 3.0 (siap di-import ke HP / WhatsApp)
 *
 * Modul ini murni (tanpa fs/db) → aman dipakai di server maupun client component.
 */

export type ExportCell = string | number

/* ------------------------------------------------------------------ Excel */

export function excelXml(sheetName: string, header: string[], rows: ExportCell[][]): string {
  const esc = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const cell = (v: ExportCell, style = '') =>
    `<Cell${style}><Data ss:Type="${typeof v === 'number' && isFinite(v) ? 'Number' : 'String'}">${esc(v)}</Data></Cell>`

  const head = `<Row>${header.map((h) => cell(h, ' ss:StyleID="h"')).join('')}</Row>`
  const body = rows.map((r) => `<Row>${r.map((v) => cell(v)).join('')}</Row>`).join('\n')
  const sheet = esc(sheetName).slice(0, 31) || 'Data'

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#00367C" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="${sheet}"><Table>${head}${body}</Table></Worksheet></Workbook>`
}

/* -------------------------------------------------------------------- CSV */

export function csvText(header: string[], rows: ExportCell[][]): string {
  const esc = (v: ExportCell) => {
    const s = String(v ?? '')
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM UTF-8 di depan → Excel lokal (Indonesia) membuka CSV dengan rapi
  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n')
}

/* ------------------------------------------------------------------- vCard */

export interface VCardInput {
  /** Nama asli (dipakai di NICKNAME / catatan). */
  nama: string
  /** Nama tampilan di HP (sudah diberi prefix). */
  displayName: string
  telepon?: string | null
  email?: string | null
  org?: string | null
  nickname?: string | null
  catatan?: string | null
}

function escVcard(v: unknown): string {
  return String(v ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function vcfText(cards: VCardInput[]): string {
  const body = cards
    .map((c) => {
      const lines: string[] = []
      lines.push('BEGIN:VCARD')
      lines.push('VERSION:3.0')
      lines.push(`FN:${escVcard(c.displayName)}`)
      lines.push(`N:${escVcard(c.displayName)};;;;`)
      if (c.org) lines.push(`ORG:${escVcard(c.org)}`)
      if (c.nickname) lines.push(`NICKNAME:${escVcard(c.nickname)}`)
      if (c.telepon) lines.push(`TEL;TYPE=CELL:${escVcard(c.telepon)}`)
      if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${escVcard(c.email)}`)
      if (c.catatan) lines.push(`NOTE:${escVcard(c.catatan)}`)
      lines.push('END:VCARD')
      return lines.join('\r\n')
    })
    .join('\r\n')
  return body + '\r\n'
}

/* --------------------------------------------------- Prefix & nama kontak */

const STOPWORD = new Set([
  'dan', 'dengan', 'di', 'ke', 'dari', 'untuk', 'yang', 'the', 'of', 'a', 'an', 'at', 'in', 'on', 'by', 'ke',
])

/**
 * Saran prefix otomatis dari judul event + tanggal.
 * Contoh: "Kajian Umum Islam" tanggal 31 → "KUI31".
 * Admin tetap boleh mengubahnya di popup konfirmasi.
 */
export function suggestPrefix(title: string, date: Date): string {
  const words = String(title ?? '')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const meaningful = words.filter((w) => !STOPWORD.has(w.toLowerCase()))
  const picked = (meaningful.length ? meaningful : words).slice(0, 3)
  const initials = picked.map((w) => w[0].toUpperCase()).join('')
  const day = String(date.getDate()).padStart(2, '0')
  return `${initials || 'EV'}${day}`
}

/**
 * Nama kontak hasil export VCF.
 * Format: `{prefix}_{nama}_{tahun}` — bagian yang kosong otomatis dilewati.
 * Contoh: prefix "KUI31", nama "Budi Santoso", tahun "2026" → "KUI31_Budi Santoso_2026".
 */
export function formatContactName(
  nama: string,
  opts: { prefix?: string | null; tahun?: string | null } = {},
): string {
  const prefix = (opts.prefix ?? '').trim()
  const tahun = (opts.tahun ?? '').trim()
  const core = String(nama ?? '').trim()
  return [prefix, core, tahun].filter(Boolean).join('_')
}

/* -------------------------------------------------------------- nama file */

export function exportFileName(base: string, ext: string): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const slug =
    String(base ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export'
  return `${slug}-${stamp}.${ext}`
}

/** Content-Disposition + content-type untuk response unduhan. */
export function downloadHeaders(fileName: string, contentType: string): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store',
  }
}
