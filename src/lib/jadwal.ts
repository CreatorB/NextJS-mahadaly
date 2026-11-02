/**
 * Jadwal kerja: shift, jadwal mingguan per pegawai, dan hari libur.
 *
 * Urutan berlaku jam kerja efektif untuk seorang pegawai pada tanggal tertentu:
 *   1. Jam manual pegawai (jam_masuk / jam_pulang di tabel `pegawai`).
 *   2. Shift dari jadwal mingguan pegawai (tabel `jadwal_shift`).
 *   3. Shift default (pengaturan absensi).
 *   4. Jam kerja global (pengaturan absensi).
 */

import prisma from '@/lib/prisma'
import type { PengaturanAbsensi } from '@/lib/absensi'
import { indexHari } from '@/lib/absensi'

export interface ShiftInfo {
  id: number
  nama: string
  jamMasuk: string
  jamPulang: string
  toleransiMenit: number
  jamIstirahatMulai: string | null
  jamIstirahatSelesai: string | null
}

export interface PegawaiJadwal {
  id: number
  jamMasuk: string | null
  jamPulang: string | null
  toleransiMenit: number | null
}

export interface JamKerjaEfektif {
  jamMasuk: string
  jamPulang: string
  toleransiMenit: number
  jamIstirahatMulai: string | null
  jamIstirahatSelesai: string | null
  sumber: 'manual' | 'shift' | 'global'
  namaShift: string | null
}

export interface KonteksJadwal {
  pengaturan: PengaturanAbsensi
  shiftDefault: ShiftInfo | null
  shiftById: Map<number, ShiftInfo>
  /** pegawaiId -> (hari -> shiftId) */
  jadwalByPegawai: Map<number, Map<number, number>>
  /** timestamp tanggal (UTC tengah malam) -> nama hari libur */
  hariLibur: Map<number, string>
}

function keShiftInfo(s: {
  id: number
  nama: string
  jamMasuk: string
  jamPulang: string
  toleransiMenit: number
  jamIstirahatMulai: string | null
  jamIstirahatSelesai: string | null
}): ShiftInfo {
  return {
    id: s.id,
    nama: s.nama,
    jamMasuk: s.jamMasuk,
    jamPulang: s.jamPulang,
    toleransiMenit: s.toleransiMenit,
    jamIstirahatMulai: s.jamIstirahatMulai,
    jamIstirahatSelesai: s.jamIstirahatSelesai,
  }
}

/**
 * Muat seluruh data jadwal (shift, jadwal pegawai, hari libur) untuk satu
 * periode. Dipanggil sekali per permintaan rekap agar tidak query berulang.
 */
export async function muatKonteksJadwal(
  pengaturan: PengaturanAbsensi,
  opsi?: { dari?: Date; sampai?: Date },
): Promise<KonteksJadwal> {
  const [shifts, jadwals, liburs] = await Promise.all([
    prisma.shift.findMany({ where: { isActive: true }, orderBy: { nama: 'asc' } }),
    prisma.jadwalShift.findMany(),
    prisma.hariLibur.findMany({
      where:
        opsi?.dari || opsi?.sampai
          ? {
              tanggal: {
                ...(opsi.dari ? { gte: opsi.dari } : {}),
                ...(opsi.sampai ? { lte: opsi.sampai } : {}),
              },
            }
          : undefined,
    }),
  ])

  const shiftById = new Map<number, ShiftInfo>()
  for (const s of shifts) shiftById.set(s.id, keShiftInfo(s))

  const jadwalByPegawai = new Map<number, Map<number, number>>()
  for (const j of jadwals) {
    let perHari = jadwalByPegawai.get(j.pegawaiId)
    if (!perHari) {
      perHari = new Map<number, number>()
      jadwalByPegawai.set(j.pegawaiId, perHari)
    }
    perHari.set(j.hari, j.shiftId)
  }

  const hariLibur = new Map<number, string>()
  for (const l of liburs) hariLibur.set(l.tanggal.getTime(), l.nama)

  const shiftDefault = pengaturan.defaultShiftId
    ? (shiftById.get(pengaturan.defaultShiftId) ?? null)
    : null

  return { pengaturan, shiftDefault, shiftById, jadwalByPegawai, hariLibur }
}

/**
 * Jam kerja efektif seorang pegawai pada tanggal tertentu.
 */
export function jamKerjaUntuk(
  konteks: KonteksJadwal,
  pegawai: PegawaiJadwal,
  tanggal: Date,
): JamKerjaEfektif {
  // 1. Jam manual pegawai (paling tinggi prioritasnya).
  if (pegawai.jamMasuk && pegawai.jamPulang) {
    return {
      jamMasuk: pegawai.jamMasuk,
      jamPulang: pegawai.jamPulang,
      toleransiMenit: pegawai.toleransiMenit ?? konteks.pengaturan.toleransiMenit,
      jamIstirahatMulai: null,
      jamIstirahatSelesai: null,
      sumber: 'manual',
      namaShift: 'Jam manual',
    }
  }

  // 2. Shift dari jadwal mingguan pegawai.
  const hari = indexHari(tanggal)
  const shiftId = konteks.jadwalByPegawai.get(pegawai.id)?.get(hari)
  const shift = shiftId ? konteks.shiftById.get(shiftId) : undefined
  if (shift) {
    return {
      jamMasuk: shift.jamMasuk,
      jamPulang: shift.jamPulang,
      toleransiMenit: shift.toleransiMenit,
      jamIstirahatMulai: shift.jamIstirahatMulai,
      jamIstirahatSelesai: shift.jamIstirahatSelesai,
      sumber: 'shift',
      namaShift: shift.nama,
    }
  }

  // 3. Shift default.
  if (konteks.shiftDefault) {
    const s = konteks.shiftDefault
    return {
      jamMasuk: s.jamMasuk,
      jamPulang: s.jamPulang,
      toleransiMenit: s.toleransiMenit,
      jamIstirahatMulai: s.jamIstirahatMulai,
      jamIstirahatSelesai: s.jamIstirahatSelesai,
      sumber: 'shift',
      namaShift: s.nama,
    }
  }

  // 4. Jam kerja global.
  return {
    jamMasuk: konteks.pengaturan.jamMasuk,
    jamPulang: konteks.pengaturan.jamPulang,
    toleransiMenit: konteks.pengaturan.toleransiMenit,
    jamIstirahatMulai: null,
    jamIstirahatSelesai: null,
    sumber: 'global',
    namaShift: null,
  }
}

/** Apakah tanggal tersebut hari kerja (bukan libur dan bukan di luar hari kerja). */
export function adalahHariKerjaTanggal(
  konteks: KonteksJadwal,
  tanggal: Date,
): boolean {
  if (konteks.hariLibur.has(tanggal.getTime())) return false
  return konteks.pengaturan.hariKerja.includes(indexHari(tanggal))
}

/** Nama hari libur pada tanggal tersebut (kalau ada). */
export function namaHariLibur(konteks: KonteksJadwal, tanggal: Date): string | null {
  return konteks.hariLibur.get(tanggal.getTime()) ?? null
}
