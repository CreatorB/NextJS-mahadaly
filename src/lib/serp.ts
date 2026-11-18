/**
 * Perkiraan lebar teks dalam piksel untuk pratinjau hasil pencarian (SERP).
 *
 * Google memotong judul & deskripsi bukan dihitung dari jumlah karakter, tapi
 * dari lebar piksel. Tanpa perkiraan ini, pratinjau di panel admin akan
 * menampilkan terlalu banyak/teorititis karakter dibanding hasil sebenarnya.
 *
 *Lebar advance tiap karakter diambil dari tabel metrik font sans-serif umum
 * (dalam satuan 1/1000 em), lalu dikalikan ukuran font.
 */

const NARROW = new Set([...'iljtf rI.,\'"!|:;()[]-'.replace(/\s/g, '')])
const WIDE = new Set(['M', 'W'])

export function pixelWidth(text: string, fontSizePx = 20): number {
  let units = 0
  for (const ch of text) {
    if (ch === ' ') units += 280
    else if (NARROW.has(ch)) units += 280
    else if (WIDE.has(ch)) units += 900
    else if (ch >= 'A' && ch <= 'Z') units += 680
    else if (ch >= 'a' && ch <= 'z') units += 550
    else if (ch >= '0' && ch <= '9') units += 550
    else if (ch.charCodeAt(0) > 0x2e80) units += 1000
    else units += 600
  }
  return Math.round((units / 1000) * fontSizePx)
}

/** Potong teks di batas piksel, dipakai untuk pratinjau SERP. */
export function truncateByWidth(text: string, maxPx: number, fontSizePx = 20): string {
  if (pixelWidth(text, fontSizePx) <= maxPx) return text
  let out = ''
  for (const ch of text) {
    if (pixelWidth(out + ch, fontSizePx) > maxPx) return `${out.replace(/[\s,.;:-]+$/, '')}…`
    out += ch
  }
  return out
}

/** Batas potong Google: judul 580px @20px, deskripsi 920px @14px. */
export const SERP_TITLE_MAX_PX = 580
export const SERP_DESC_MAX_PX = 920
