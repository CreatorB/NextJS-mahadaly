/**
 * Pengajuan izin / sakit / cuti oleh staf dan pencatatan absensi turunan.
 *
 * Alur baru (standar aplikasi absensi):
 *   1. Staf mengajukan (izin / sakit / cuti) -> status `menunggu`.
 *   2. Admin menyetujui -> dibuat catatan absensi berstatus sesuai jenis,
 *      atau menolak -> dicatat di riwayat audit.
 *   3. Admin juga bisa membuat catatan manual untuk hari tanpa catatan.
 */

import prisma from '@/lib/prisma'
import {
  STATUS_ALPA,
  STATUS_CUTI,
  STATUS_IZIN,
  STATUS_SAKIT,
  ambilPengaturanAbsensi,
  tanggalHariIniWib,
} from '@/lib/absensi'
import { muatKonteksJadwal } from '@/lib/jadwal'

export const JENIS_PENGAJUAN = ['izin', 'sakit', 'cuti'] as const
export type JenisPengajuan = (typeof JENIS_PENGAJUAN)[number]

export const STATUS_PENGAJUAN = ['menunggu', 'disetujui', 'ditolak', 'dibatalkan'] as const
export type StatusPengajuan = (typeof STATUS_PENGAJUAN)[number]

export const LABEL_JENIS: Record<string, string> = {
  izin: 'Izin',
  sakit: 'Sakit',
  cuti: 'Cuti',
}

/** "YYYY-MM-DD" -> Date UTC tengah malam (sesuai kolom DATE). */
export function parseTanggalWib(v: string | undefined | null): Date | null {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Daftar tanggal (UTC tengah malam) dari tanggalMulai s.d. tanggalSelesai. */
export function rentangTanggal(dari: Date, sampai: Date): Date[] {
  const hasil: Date[] = []
  for (let t = dari.getTime(); t <= sampai.getTime(); t += 86400000) {
    hasil.push(new Date(t))
  }
  return hasil
}

/**
 * Buat / perbarui catatan absensi untuk seorang pegawai pada satu tanggal.
 */
export async function buatCatatanAbsensi(params: {
  pegawaiId: number
  tanggal: Date
  status: string
  keterangan?: string | null
  sumber?: string
}): Promise<{ id: number; dibuat: boolean }> {
  const data = {
    status: params.status,
    keterangan: params.keterangan ?? null,
    sumber: params.sumber ?? 'manual',
  }
  const existing = await prisma.absensiKerja.findUnique({
    where: { pegawaiId_tanggal: { pegawaiId: params.pegawaiId, tanggal: params.tanggal } },
  })
  if (existing) {
    const upd = await prisma.absensiKerja.update({ where: { id: existing.id }, data })
    return { id: upd.id, dibuat: false }
  }
  const baru = await prisma.absensiKerja.create({
    data: { pegawaiId: params.pegawaiId, tanggal: params.tanggal, ...data },
  })
  return { id: baru.id, dibuat: true }
}

/**
 * Terapkan pengajuan yang disetujui: buat catatan izin / sakit / cuti untuk
 * setiap hari kerja dalam rentang pengajuan.
 */
export async function terapkanPengajuanDisetujui(pengajuan: {
  id: number
  pegawaiId: number
  jenis: string
  tanggalMulai: Date
  tanggalSelesai: Date
  keterangan: string
}): Promise<number> {
  const pengaturan = await ambilPengaturanAbsensi()
  const konteks = await muatKonteksJadwal(pengaturan, {
    dari: pengajuan.tanggalMulai,
    sampai: pengajuan.tanggalSelesai,
  })

  const status =
    pengajuan.jenis === 'sakit'
      ? STATUS_SAKIT
      : pengajuan.jenis === 'cuti'
        ? STATUS_CUTI
        : STATUS_IZIN

  let dibuat = 0
  for (const tanggal of rentangTanggal(pengajuan.tanggalMulai, pengajuan.tanggalSelesai)) {
    // Lewati hari libur dan hari yang bukan hari kerja.
    if (konteks.hariLibur.has(tanggal.getTime())) continue
    if (!pengaturan.hariKerja.includes(tanggal.getUTCDay())) continue
    const hasil = await buatCatatanAbsensi({
      pegawaiId: pengajuan.pegawaiId,
      tanggal,
      status,
      keterangan: pengajuan.keterangan,
      sumber: 'pengajuan',
    })
    if (hasil.dibuat) dibuat++
  }
  return dibuat
}

/**
 * Simpan otomatis catatan alpa untuk hari kerja yang lewat tanpa catatan.
 *
 * Dipakai bila pengaturan `autoSimpanAlpa` aktif: hari kerja yang sudah lewat
 * lebih dari `batasAlpaHari` dan tidak punya catatan absensi otomatis dicatat
 * sebagai alpa.
 */
export async function simpanAlpaOtomatis(): Promise<number> {
  const pengaturan = await ambilPengaturanAbsensi()
  if (!pengaturan.autoSimpanAlpa) return 0

  const hariIni = tanggalHariIniWib()
  const batas = new Date(hariIni.getTime() - pengaturan.batasAlpaHari * 86400000)
  const dari = new Date(batas.getTime() - 60 * 86400000)

  const pengaturanAwal = await ambilPengaturanAbsensi()
  const konteks = await muatKonteksJadwal(pengaturanAwal, { dari, sampai: batas })

  const pegawai = await prisma.pegawai.findMany({ where: { isActive: true } })
  const existing = await prisma.absensiKerja.findMany({
    where: { tanggal: { gte: dari, lte: batas } },
    select: { pegawaiId: true, tanggal: true },
  })
  const sudah = new Set(existing.map((r) => `${r.pegawaiId}|${r.tanggal.getTime()}`))

  let dibuat = 0
  for (let t = dari.getTime(); t <= batas.getTime(); t += 86400000) {
    const tanggal = new Date(t)
    if (konteks.hariLibur.has(tanggal.getTime())) continue
    if (!pengaturanAwal.hariKerja.includes(tanggal.getUTCDay())) continue
    for (const p of pegawai) {
      if (sudah.has(`${p.id}|${t}`)) continue
      await buatCatatanAbsensi({
        pegawaiId: p.id,
        tanggal,
        status: STATUS_ALPA,
        keterangan: 'Otomatis: tidak ada catatan absen sampai batas akhir konfirmasi',
        sumber: 'otomatis',
      })
      dibuat++
    }
  }
  return dibuat
}

/**
 * Daftar tanggal hari ini yang sudah ada pengajuan disetujui (izin/sakit/cuti).
 * Dipakai untuk mengunci absen masuk pada hari tersebut.
 */
export async function pengajuanDisetujuiPadaTanggal(
  pegawaiId: number,
  tanggal: Date,
): Promise<{ jenis: string; keterangan: string } | null> {
  const pengajuan = await prisma.pengajuan.findFirst({
    where: {
      pegawaiId,
      status: 'disetujui',
      jenis: { in: ['izin', 'sakit', 'cuti'] },
      tanggalMulai: { lte: tanggal },
      tanggalSelesai: { gte: tanggal },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!pengajuan) return null
  return { jenis: pengajuan.jenis, keterangan: pengajuan.keterangan }
}
