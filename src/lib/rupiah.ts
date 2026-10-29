/**
 * Format nominal rupiah — TANPA import server (aman dipakai di Client Component).
 * Modul `lib/kias.ts` mengimpor prisma, jadi komponen klien tidak boleh
 * mengambil formatRupiah dari sana (menarik driver DB ke bundle browser).
 */

export function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

/** Ringkas nominal untuk tampilan harga besar: 250000 → "250rb", 3000000 → "3 jt". */
export function formatRupiahShort(n: number) {
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return `${jt.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`
  return n.toLocaleString('id-ID')
}
