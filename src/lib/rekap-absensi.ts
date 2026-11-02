/**
 * Rekap absensi kerja untuk panel admin.
 *
 * Query dasar: rentang tanggal (WIB), filter pegawai, filter status.
 * Mengembalikan baris rekap, ringkasan (hadir/telat/izin/sakit/alpa/tanpa
 * absen), dan rekap per pegawai.
 */

import prisma from '@/lib/prisma'
import {
  STATUS_ALPA,
  STATUS_HADIR,
  STATUS_IZIN,
  STATUS_SAKIT,
  STATUS_TELAT,
  ambilPengaturanAbsensi,
  adalahHariKerja,
  indexHari,
  jamKeMenit,
  tanggalHariIniWib,
} from '@/lib/absensi'

export interface ParamsRekap {
  dari?: string
  sampai?: string
  pegawaiId?: number
  status?: string
  includeTanpaAbsen?: boolean
}

const MAKS_BARIS_TANPA_ABSEN = 800

/** Ubah "YYYY-MM-DD" menjadi Date tengah malam UTC (sesuai kolom DATE). */
export function parseTanggal(v: string | undefined | null): Date | null {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(d.getTime()) ? null : d
}

export function rentangDefault(params: ParamsRekap): { dari: Date; sampai: Date } {
  const hariIni = tanggalHariIniWib()
  const dari = parseTanggal(params.dari) ?? new Date(hariIni.getTime() - 29 * 86400000)
  const sampai = parseTanggal(params.sampai) ?? hariIni
  return { dari, sampai }
}

/** Jumlah hari kerja dalam rentang (untuk perhitungan durasi kerja). */
export function jumlahHariKerja(dari: Date, sampai: Date, hariKerja: number[]): number {
  let n = 0
  for (let d = dari.getTime(); d <= sampai.getTime(); d += 86400000) {
    if (adalahHariKerja(new Date(d), hariKerja)) n++
  }
  return n
}

export async function ambilRekap(params: ParamsRekap) {
  const { dari, sampai } = rentangDefault(params)
  const pengaturan = await ambilPengaturanAbsensi()

  const rows = await prisma.absensiKerja.findMany({
    where: {
      tanggal: { gte: dari, lte: sampai },
      ...(params.pegawaiId ? { pegawaiId: params.pegawaiId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: [{ tanggal: 'desc' }, { pegawai: { nama: 'asc' } }],
    include: {
      pegawai: {
        select: {
          id: true,
          nama: true,
          jabatan: true,
          noHp: true,
          jamMasuk: true,
          jamPulang: true,
          toleransiMenit: true,
        },
      },
    },
  })

  const pegawaiAktif = await prisma.pegawai.findMany({
    where: {
      isActive: true,
      ...(params.pegawaiId ? { id: params.pegawaiId } : {}),
    },
    orderBy: { nama: 'asc' },
    select: {
      id: true,
      nama: true,
      jabatan: true,
      noHp: true,
      jamMasuk: true,
      jamPulang: true,
      toleransiMenit: true,
    },
  })

  // Rekap per pegawai.
  const perPegawai = pegawaiAktif.map((p) => {
    const milik = rows.filter((r) => r.pegawaiId === p.id)
    const hadir = milik.filter((r) => r.status === STATUS_HADIR).length
    const telat = milik.filter((r) => r.status === STATUS_TELAT).length
    const izin = milik.filter((r) => r.status === STATUS_IZIN).length
    const sakit = milik.filter((r) => r.status === STATUS_SAKIT).length
    const alpa = milik.filter((r) => r.status === STATUS_ALPA).length

    const totalMenit = milik.reduce((acc, r) => {
      if (!r.jamMasuk || !r.jamPulang) return acc
      return acc + (r.jamPulang.getTime() - r.jamMasuk.getTime()) / 60000
    }, 0)
    const hariMasuk = milik.filter((r) => r.jamMasuk).length

    const jamMasukEfektif = p.jamMasuk ?? pengaturan.jamMasuk
    const jamPulangEfektif = p.jamPulang ?? pengaturan.jamPulang
    const durasiTarget = jamKeMenit(jamPulangEfektif) - jamKeMenit(jamMasukEfektif)

    return {
      pegawaiId: p.id,
      nama: p.nama,
      jabatan: p.jabatan,
      noHp: p.noHp,
      jamMasuk: jamMasukEfektif,
      jamPulang: jamPulangEfektif,
      jamKerjaManual: Boolean(p.jamMasuk || p.jamPulang),
      hadir,
      telat,
      izin,
      sakit,
      alpa,
      hariMasuk,
      totalCatatan: milik.length,
      rataRataJam: hariMasuk ? Number((totalMenit / hariMasuk / 60).toFixed(2)) : 0,
      durasiTargetJam: Number((durasiTarget / 60).toFixed(2)),
      belumPulang: milik.filter((r) => r.jamMasuk && !r.jamPulang).length,
    }
  })

  // Baris "tanpa absen": pegawai aktif tanpa catatan pada hari kerja.
  const tanpaAbsen: Array<Record<string, unknown>> = []
  let jumlahTanpaAbsen = 0

  if (params.includeTanpaAbsen) {
    const sudahAda = new Set(rows.map((r) => `${r.pegawaiId}|${r.tanggal.getTime()}`))
    const hariIni = tanggalHariIniWib()
    const batasAtas = Math.min(sampai.getTime(), hariIni.getTime())

    for (let t = dari.getTime(); t <= batasAtas; t += 86400000) {
      const tanggal = new Date(t)
      if (!adalahHariKerja(tanggal, pengaturan.hariKerja)) continue
      for (const p of pegawaiAktif) {
        if (sudahAda.has(`${p.id}|${t}`)) continue
        jumlahTanpaAbsen++
        if (tanpaAbsen.length < MAKS_BARIS_TANPA_ABSEN) {
          tanpaAbsen.push({
            id: null,
            tanggal: new Date(t),
            pegawaiId: p.id,
            nama: p.nama,
            jabatan: p.jabatan,
            jamMasuk: null,
            jamPulang: null,
            metode: null,
            jarakMeter: null,
            status: STATUS_ALPA,
            keterangan: 'Tidak ada catatan absen',
            hariKe: indexHari(tanggal),
          })
        }
      }
    }
  }

  const summary = {
    total: rows.length,
    hadir: rows.filter((r) => r.status === STATUS_HADIR).length,
    telat: rows.filter((r) => r.status === STATUS_TELAT).length,
    izin: rows.filter((r) => r.status === STATUS_IZIN).length,
    sakit: rows.filter((r) => r.status === STATUS_SAKIT).length,
    alpa: rows.filter((r) => r.status === STATUS_ALPA).length,
    belumPulang: rows.filter((r) => r.jamMasuk && !r.jamPulang).length,
    tanpaAbsen: jumlahTanpaAbsen,
    jumlahPegawai: pegawaiAktif.length,
    hariKerja: jumlahHariKerja(dari, sampai, pengaturan.hariKerja),
  }

  return { dari, sampai, rows, summary, perPegawai, tanpaAbsen, pengaturan }
}
