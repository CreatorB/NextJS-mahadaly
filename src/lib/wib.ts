/**
 * Helper tanggal/waktu zona WIB (Asia/Jakarta).
 *
 * Modul terpisah dari `absensi.ts` karena file itu meng-import Prisma,
 * sedangkan helper ini dipakai juga di client component.
 *
 * Catatan penting: kolom DATE di database disimpan sebagai UTC tengah malam
 * (lihat `tanggalHariIniWib`), sehingga tanggal hasil baca database bisa
 * langsung diambil dengan `.toISOString().slice(0, 10)`. Helper di sini
 * hanya untuk menghitung "hari ini" dari waktu saat ini.
 */

const WIB_OFFSET_MS = 7 * 3600 * 1000

/** Tanggal hari ini di WIB, dinormalisasi ke UTC tengah malam (untuk kolom DATE). */
export function tanggalHariIniWib(now: Date = new Date()): Date {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS)
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()))
}

/** Tanggal (YYYY-MM-DD) hari ini di WIB. */
export function tanggalStringWib(now: Date = new Date()): string {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS)
  return wib.toISOString().slice(0, 10)
}

/** Menit sejak tengah malam dari sebuah objek Date, dalam zona WIB. */
export function menitWib(date: Date): number {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS)
  return wib.getUTCHours() * 60 + wib.getUTCMinutes()
}
