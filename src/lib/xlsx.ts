/**
 * Pembaca XLSX minimal tanpa dependency tambahan.
 *
 * XLSX = file ZIP berisi XML. Server produksi tidak punya python/openpyxl
 * dan tidak bisa di dependedalkan ke npm tanpa reinstall node_modules, jadi
 * modul ini membaca ZIP (inflate bawaan node:zlib) lalu parses XML sheet
 * secara langsung.
 *
 * Cukup untuk berkas ekspor Google Form / Excel biasa: shared strings,
 * inline string, angka, dan tanggal (format teks).
 */

import { inflateRawSync } from 'node:zlib'

const SIG_EOCD = 0x06054b50
const SIG_CENTRAL = 0x02014b50

/** Ekstrak seluruh entry dari file ZIP ke Map<nama, Buffer>. */
export function unzipEntries(buf: Buffer): Map<string, Buffer> {
  // Cari End of Central Directory (mundur dari akhir file).
  let eocd = -1
  const batas = Math.max(0, buf.length - 22 - 65535)
  for (let i = buf.length - 22; i >= batas; i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Berkas bukan ZIP/XLSX yang valid.')

  const jumlah = buf.readUInt16LE(eocd + 10)
  let off = buf.readUInt32LE(eocd + 16)
  const entries = new Map<string, Buffer>()

  for (let i = 0; i < jumlah; i++) {
    if (off + 46 > buf.length) break
    if (buf.readUInt32LE(off) !== SIG_CENTRAL) break

    const method = buf.readUInt16LE(off + 10)
    const compSize = buf.readUInt32LE(off + 20)
    const nameLen = buf.readUInt16LE(off + 28)
    const extraLen = buf.readUInt16LE(off + 30)
    const commentLen = buf.readUInt16LE(off + 32)
    const localOff = buf.readUInt32LE(off + 42)
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen)

    if (localOff + 30 <= buf.length) {
      const lhNameLen = buf.readUInt16LE(localOff + 26)
      const lhExtraLen = buf.readUInt16LE(localOff + 28)
      const start = localOff + 30 + lhNameLen + lhExtraLen
      const data = buf.subarray(start, Math.min(start + compSize, buf.length))
      try {
        entries.set(name, method === 0 ? Buffer.from(data) : inflateRawSync(data))
      } catch {
        entries.set(name, Buffer.alloc(0))
      }
    }

    off += 46 + nameLen + extraLen + commentLen
  }

  return entries
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&')
}

/** Ambil seluruh teks <t>...</t> dari satu fragmen XML. */
function kumpulanTeks(xml: string): string {
  const hasil: string[] = []
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    hasil.push(m[1] ? decodeXml(m[1]) : '')
  }
  return hasil.join('')
}

/** "BC12" -> indeks kolom 0-based (B=1). */
export function kolomKeIndeks(ref: string): number {
  const m = /^([A-Z]+)/.exec(ref.toUpperCase())
  if (!m) return 0
  let idx = 0
  for (const ch of m[1]) idx = idx * 26 + (ch.charCodeAt(0) - 64)
  return idx - 1
}

function parseSharedStrings(xml: string): string[] {
  const hasil: string[] = []
  const re = /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    hasil.push(kumpulanTeks(m[1]))
  }
  return hasil
}

/**
 * Baca semua baris dari sheet pertama.
 * Nilai dikembalikan sebagai string (angka & tanggal dibikin teks).
 */
export function readXlsxRows(buf: Buffer): string[][] {
  const entries = unzipEntries(buf)

  const workbookXml = entries.get('xl/workbook.xml')?.toString('utf8') ?? ''
  const relsXml = entries.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? ''

  // Target sheet pertama.
  let target = 'worksheets/sheet1.xml'
  const sheetMatch = /<sheet\b[^>]*r:id="([^"]+)"/.exec(workbookXml)
  if (sheetMatch) {
    const rid = sheetMatch[1]
    const relRe = new RegExp(
      `<Relationship\\b[^>]*Id="${rid}"[^>]*Target="([^"]+)"`,
    )
    const rel = relRe.exec(relsXml)
    if (rel) {
      const t = rel[1].replace(/^\/?xl\//, '').replace(/^\//, '')
      target = t.startsWith('worksheets') ? t : `worksheets/${t}`
    }
  }

  const sheetXml =
    entries.get(`xl/${target}`)?.toString('utf8') ??
    entries.get('xl/worksheets/sheet1.xml')?.toString('utf8') ??
    ''

  const shared = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '')

  const baris: string[][] = []
  // PENTING: `[^>]*?` harus lazy. Kalau greedy, atribut self-closing (`<c .../>`)
  // akan menelan tanda `/` dan mencocokkan sel berikutnya.
  const rowRe = /<row\b([^>]*?)(\/>|>([\s\S]*?)<\/row>)/g
  let rowM: RegExpExecArray | null

  while ((rowM = rowRe.exec(sheetXml)) !== null) {
    const rowAttrs = rowM[1]
    const body = rowM[3] ?? ''
    const rAttr = /r="(\d+)"/.exec(rowAttrs)
    const nomorBaris = rAttr ? Number(rAttr[1]) : baris.length + 1

    const sel: string[] = []
    const cellRe = /<c\b([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g
    let cM: RegExpExecArray | null

    while ((cM = cellRe.exec(body)) !== null) {
      const attrs = cM[1]
      const inner = cM[3] ?? ''
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)
      const colIdx = ref ? kolomKeIndeks(ref[1]) : sel.length
      const tipe = /t="([^"]+)"/.exec(attrs)?.[1] ?? 'n'

      let nilai = ''
      if (tipe === 's') {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1]
        const idx = v ? Number(v) : -1
        nilai = idx >= 0 ? (shared[idx] ?? '') : ''
      } else if (tipe === 'inlineStr') {
        nilai = kumpulanTeks(inner)
      } else if (tipe === 'str') {
        nilai = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '')
      } else if (tipe === 'b') {
        nilai = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] === '1' ? 'TRUE' : 'FALSE'
      } else {
        nilai = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '')
      }

      while (sel.length < colIdx) sel.push('')
      sel[colIdx] = nilai.trim()
    }

    while (baris.length < nomorBaris - 1) baris.push([])
    baris[nomorBaris - 1] = sel
  }

  return baris
}

/**
 * Cari indeks kolom berdasarkan awalan nama header (case-insensitive).
 */
export function cariKolom(
  header: string[],
  ...prefixes: string[]
): number {
  for (const pref of prefixes) {
    for (let i = 0; i < header.length; i++) {
      const h = (header[i] ?? '').trim()
      if (h && h.toLowerCase().startsWith(pref.toLowerCase())) return i
    }
  }
  return -1
}
