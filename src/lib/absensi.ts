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
export const STATUS_CUTI = 'cuti'
export const STATUS_ALPA = 'alpa'

export const SEMUA_STATUS = [
  STATUS_HADIR,
  STATUS_TELAT,
  STATUS_IZIN,
  STATUS_SAKIT,
  STATUS_CUTI,
  STATUS_ALPA,
] as const

/** Status yang boleh diisi oleh admin / hasil persetujuan pengajuan. */
export const STATUS_ADMIN = [
  STATUS_IZIN,
  STATUS_SAKIT,
  STATUS_CUTI,
  STATUS_ALPA,
  STATUS_HADIR,
  STATUS_TELAT,
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
  /** Batas keterlambatan (menit) sebelum absen otomatis dihitung alpa. 0 = tidak otomatis. */
  batasTelatMenit: number
  /** Berapa hari setelah tanggal kerja, "tanpa absen" otomatis disimpan sebagai alpa. */
  batasAlpaHari: number
  /** Simpan otomatis catatan alpa untuk hari yang lewat tanpa keterangan. */
  autoSimpanAlpa: boolean
  /** Shift default bila pegawai tidak punya jadwal shift per hari. */
  defaultShiftId: number | null
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
      batasTelatMenit: 0,
      batasAlpaHari: 1,
      autoSimpanAlpa: false,
      defaultShiftId: null,
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
    batasTelatMenit: row.batasTelatMenit,
    batasAlpaHari: row.batasAlpaHari,
    autoSimpanAlpa: row.autoSimpanAlpa,
    defaultShiftId: row.defaultShiftId,
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
 * Menit keterlambatan compared terhadap jam mulai kerja + toleransi.
 * 0 = tidak terlambat.
 */
export function menitKeterlambatan(jamMasuk: Date, pengaturan: PengaturanAbsensi): number {
  const batas = jamKeMenit(pengaturan.jamMasuk) + pengaturan.toleransiMenit
  const selisih = menitWib(jamMasuk) - batas
  return selisih > 0 ? selisih : 0
}

/**
 * Status kehadiran berdasarkan jam masuk (dibandingkan dengan jam mulai kerja
 * + toleransi keterlambatan).
 *
 * Bila `batasTelatMenit` > 0, keterlambatan yang melebihi batas tersebut
 * otomatis berstatus alpa (aturan standar: telat lebih dari batas = tidak hadir).
 */
export function statusByJamMasuk(
  jamMasuk: Date,
  pengaturan: PengaturanAbsensi,
): string {
  const terlambat = menitKeterlambatan(jamMasuk, pengaturan)
  if (terlambat <= 0) return STATUS_HADIR
  if (pengaturan.batasTelatMenit > 0 && terlambat > pengaturan.batasTelatMenit) {
    return STATUS_ALPA
  }
  return STATUS_TELAT
}

/**
 * Durasi kerja(target) dalam menit, dikurangi waktu istirahat bila ada.
 */
export function durasiTargetMenit(
  jamMasuk: string,
  jamPulang: string,
  jamIstirahatMulai?: string | null,
  jamIstirahatSelesai?: string | null,
): number {
  const mulai = jamKeMenit(jamMasuk)
  const selesai = jamKeMenit(jamPulang)
  let durasi = selesai - mulai
  if (durasi < 0) durasi += 24 * 60
  if (jamIstirahatMulai && jamIstirahatSelesai) {
    const istirahat = jamKeMenit(jamIstirahatSelesai) - jamKeMenit(jamIstirahatMulai)
    durasi -= istirahat > 0 ? istirahat : 0
  }
  return durasi > 0 ? durasi : 0
}

/**
 * Hitung menit lembur: durasi kerja nyata dikurangi durasi target.
 * Nol bila kerja nyata tidak lebih dari target.
 */
export function hitungLemburMenit(
  jamMasuk: Date | null,
  jamPulang: Date | null,
  targetMenit: number,
): number {
  if (!jamMasuk || !jamPulang) return 0
  const durasi = Math.round((jamPulang.getTime() - jamMasuk.getTime()) / 60000)
  const lembur = durasi - targetMenit
  return lembur > 0 ? lembur : 0
}

/** Daftar IP Wi-Fi yang diizinkan (dari pengaturan). */
export function ipDiizinkan(ip: string | null | undefined, pengaturan: PengaturanAbsensi): boolean {
  if (!ip) return false
  const bersih = ip.trim()
  return pengaturan.wifiIps.some((allowed) => allowed.trim() === bersih)
}
