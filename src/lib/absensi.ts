/**
 * Helper absensi kerja (staf / pegawai).
 *
 * Semua perhitungan waktu memakai zona WIB (Asia/Jakarta) supaya jam masuk
 * yang tampil konsisten dengan jam lokal ma'had, apa pun lokasi server.
 */

import prisma from '@/lib/prisma'
import { NAMA_HARI } from '@/lib/hari'

export { NAMA_HARI }

export const METODE_GPS = 'gps'
export const METODE_WIFI = 'wifi'

export const STATUS_HADIR = 'hadir'
export const STATUS_TELAT = 'telat'
export const STATUS_IZIN = 'izin'
export const STATUS_SAKIT = 'sakit'
export const STATUS_ALPA = 'alpa'

export const SEMUA_STATUS = [
  STATUS_HADIR,
  STATUS_TELAT,
  STATUS_IZIN,
  STATUS_SAKIT,
  STATUS_ALPA,
] as const

export type MetodeAbsen = typeof METODE_GPS | typeof METODE_WIFI

export interface PengaturanAbsensi {
  jamMasuk: string
  jamPulang: string
  toleransiMenit: number
  latitude: number
  longitude: number
  radiusMeter: number
  wifiIps: string[]
  /** Hari kerja: 0=Minggu ... 6=Sabtu. Dipakai untuk hitung otomatis "tanpa absen". */
  hariKerja: number[]
}

/** Bagian pegawai yang boleh overriding jam kerja global. */
export interface OverridesJamKerja {
  jamMasuk?: string | null
  jamPulang?: string | null
  toleransiMenit?: number | null
}

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

/** Ubah string "HH:MM" / "HH:MM:SS" menjadi-menit sejak tengah malam. */
export function jamKeMenit(jam: string): number {
  const [h, m] = jam.split(':').map((x) => Number.parseInt(x, 10))
  if (!Number.isFinite(h)) return 0
  return h * 60 + (Number.isFinite(m) ? m : 0)
}

/** Menit sejak tengah malam dari sebuah objek Date, dalam zona WIB. */
export function menitWib(date: Date): number {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS)
  return wib.getUTCHours() * 60 + wib.getUTCMinutes()
}

/** "07:00:00" -> "07:00" */
export function jamPendek(jam: string | null | undefined): string {
  if (!jam) return '-'
  return jam.slice(0, 5)
}

/** Parse daftar hari kerja "0,1,2" -> [0,1,2] */
export function parseHariKerja(v: string | null | undefined): number[] {
  if (!v) return [0, 1, 2, 3, 4, 5, 6]
  const hasil = v
    .split(',')
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 6)
  return hasil.length ? Array.from(new Set(hasil)).sort() : [0, 1, 2, 3, 4, 5, 6]
}

/** Tanggal (UTC tengah malam) -> index hari (0=Minggu). */
export function indexHari(date: Date): number {
  return date.getUTCDay()
}

/** Apakah tanggal tersebut termasuk hari kerja. */
export function adalahHariKerja(date: Date, hariKerja: number[]): boolean {
  return hariKerja.includes(indexHari(date))
}

/** Ambil pengaturan absensi (dengan nilai bawaan bila tabel kosong). */
export async function ambilPengaturanAbsensi(): Promise<PengaturanAbsensi> {
  const row = await prisma.pengaturanAbsensi.findUnique({ where: { id: 1 } })
  if (!row) {
    return {
      jamMasuk: '07:00:00',
      jamPulang: '15:00:00',
      toleransiMenit: 5,
      latitude: -6.3951467,
      longitude: 106.9622492,
      radiusMeter: 200,
      wifiIps: ['103.178.146.98'],
      hariKerja: [0, 1, 2, 3, 4, 5, 6],
    }
  }
  return {
    jamMasuk: row.jamMasuk,
    jamPulang: row.jamPulang,
    toleransiMenit: row.toleransiMenit,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusMeter: row.radiusMeter,
    wifiIps: row.wifiIps
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
    hariKerja: parseHariKerja(row.hariKerja),
  }
}

/**
 * Pengaturan efektif untuk seorang pegawai: jam kerja manual pegawai
 * (bila diisi) menggantikan pengaturan global.
 */
export function pengaturanEfektif(
  global: PengaturanAbsensi,
  overrides: OverridesJamKerja | null | undefined,
): PengaturanAbsensi {
  if (!overrides) return global
  return {
    ...global,
    jamMasuk: overrides.jamMasuk ?? global.jamMasuk,
    jamPulang: overrides.jamPulang ?? global.jamPulang,
    toleransiMenit:
      overrides.toleransiMenit != null ? overrides.toleransiMenit : global.toleransiMenit,
  }
}

/**
 * Status kehadiran berdasarkan jam masuk (dibandingkan dengan jam mulai kerja
 * + toleransi keterlambatan).
 */
export function statusByJamMasuk(
  jamMasuk: Date,
  pengaturan: PengaturanAbsensi,
): string {
  const mulai = jamKeMenit(pengaturan.jamMasuk)
  const telat = mulai + pengaturan.toleransiMenit
  return menitWib(jamMasuk) > telat ? STATUS_TELAT : STATUS_HADIR
}

/** Daftar IP Wi-Fi yang diizinkan (dari pengaturan). */
export function ipDiizinkan(ip: string | null | undefined, pengaturan: PengaturanAbsensi): boolean {
  if (!ip) return false
  const bersih = ip.trim()
  return pengaturan.wifiIps.some((allowed) => allowed.trim() === bersih)
}
