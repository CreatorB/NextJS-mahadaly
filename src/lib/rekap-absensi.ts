/**
 * Rekap absensi kerja untuk panel admin.
 *
 * Query dasar: rentang tanggal (WIB), filter pegawai, filter status.
 * Mengembalikan baris rekap, ringkasan (hadir/telat/izin/sakit/cuti/alpa/
 * tanpa absen), rekap per pegawai, serta rekap bulanan untuk payroll.
 *
 * Jam kerja efektif tiap baris mengikuti urutan: jam manual pegawai ->
 * jadwal shift per hari -> shift default -> jam kerja global.
 */

import prisma from '@/lib/prisma'
import {
  STATUS_ALPA,
  STATUS_CUTI,
  STATUS_HADIR,
  STATUS_IZIN,
  STATUS_SAKIT,
  STATUS_TELAT,
  ambilPengaturanAbsensi,
  durasiTargetMenit,
  hitungLemburMenit,
  jamKeMenit,
  menitKeterlambatan,
  tanggalHariIniWib,
} from '@/lib/absensi'
import {
  adalahHariKerjaTanggal,
  jamKerjaUntuk,
  muatKonteksJadwal,
  namaHariLibur,
  type KonteksJadwal,
} from '@/lib/jadwal'

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

/** Awal & akhir bulan dari format "YYYY-MM". */
export function rentangBulan(bulan: string): { dari: Date; sampai: Date } {
  const m = /^(\d{4})-(\d{2})$/.exec(bulan.trim())
  if (!m) {
    const hariIni = tanggalHariIniWib()
    return {
      dari: new Date(Date.UTC(hariIni.getUTCFullYear(), hariIni.getUTCMonth(), 1)),
      sampai: hariIni,
    }
  }
  const tahun = Number(m[1])
  const bulanIdx = Number(m[2]) - 1
  return {
    dari: new Date(Date.UTC(tahun, bulanIdx, 1)),
    sampai: new Date(Date.UTC(tahun, bulanIdx + 1, 0)),
  }
}

export function rentangDefault(params: ParamsRekap): { dari: Date; sampai: Date } {
  const hariIni = tanggalHariIniWib()
  const dari = parseTanggal(params.dari) ?? new Date(hariIni.getTime() - 29 * 86400000)
  const sampai = parseTanggal(params.sampai) ?? hariIni
  return { dari, sampai }
}

/** Jumlah hari kerja dalam rentang (tidak menghitung hari libur). */
export function jumlahHariKerja(
  dari: Date,
  sampai: Date,
  hariKerja: number[],
  hariLibur?: { has(tanggal: number): boolean } | null,
): number {
  let n = 0
  for (let d = dari.getTime(); d <= sampai.getTime(); d += 86400000) {
    const t = new Date(d)
    if (hariLibur?.has(t.getTime())) continue
    if (hariKerja.includes(t.getUTCDay())) n++
  }
  return n
}

/** Data pegawai + konteks jadwal yang dipakai bersama. */
async function muatData(
  params: ParamsRekap,
  dari: Date,
  sampai: Date,
): Promise<{
  pengaturan: Awaited<ReturnType<typeof ambilPengaturanAbsensi>>
  konteks: KonteksJadwal
  pegawaiAktif: Array<{
    id: number
    nama: string
    jabatan: string | null
    noHp: string | null
    jamMasuk: string | null
    jamPulang: string | null
    toleransiMenit: number | null
  }>
  rows: Array<{
    id: number
    pegawaiId: number
    tanggal: Date
    jamMasuk: Date | null
    jamPulang: Date | null
    metode: string | null
    jarakMeter: number | null
    status: string
    keterangan: string | null
    sumber: string
    pegawai: {
      id: number
      nama: string
      jabatan: string | null
      noHp: string | null
      jamMasuk: string | null
      jamPulang: string | null
      toleransiMenit: number | null
    }
  }>
}> {
  const pengaturan = await ambilPengaturanAbsensi()
  const konteks = await muatKonteksJadwal(pengaturan, { dari, sampai })

  const [rows, pegawaiAktif] = await Promise.all([
    prisma.absensiKerja.findMany({
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
    }),
    prisma.pegawai.findMany({
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
    }),
  ])

  return { pengaturan, konteks, pegawaiAktif, rows: rows as never }
}

export async function ambilRekap(params: ParamsRekap) {
  const { dari, sampai } = rentangDefault(params)
  const { pengaturan, konteks, pegawaiAktif, rows } = await muatData(params, dari, sampai)

  // Jam kerja efektif + turunan perhitungan untuk setiap baris.
  const barisDetail = rows.map((r) => {
    const jamKerja = jamKerjaUntuk(konteks, r.pegawai, r.tanggal)
    const targetMenit = durasiTargetMenit(
      jamKerja.jamMasuk,
      jamKerja.jamPulang,
      jamKerja.jamIstirahatMulai,
      jamKerja.jamIstirahatSelesai,
    )
    const menitTelat = r.jamMasuk
      ? menitKeterlambatan(r.jamMasuk, {
          ...pengaturan,
          jamMasuk: jamKerja.jamMasuk,
          toleransiMenit: jamKerja.toleransiMenit,
        })
      : 0
    const lemburMenit = hitungLemburMenit(r.jamMasuk, r.jamPulang, targetMenit)
    const durasiKerja = r.jamMasuk && r.jamPulang
      ? Math.round((r.jamPulang.getTime() - r.jamMasuk.getTime()) / 60000)
      : 0
    return { ...r, jamKerja, targetMenit, menitTelat, lemburMenit, durasiKerja }
  })

  // Rekap per pegawai.
  const perPegawai = pegawaiAktif.map((p) => {
    const milik = barisDetail.filter((r) => r.pegawaiId === p.id)
    const hadir = milik.filter((r) => r.status === STATUS_HADIR).length
    const telat = milik.filter((r) => r.status === STATUS_TELAT).length
    const izin = milik.filter((r) => r.status === STATUS_IZIN).length
    const sakit = milik.filter((r) => r.status === STATUS_SAKIT).length
    const cuti = milik.filter((r) => r.status === STATUS_CUTI).length
    const alpa = milik.filter((r) => r.status === STATUS_ALPA).length

    const totalMenit = milik.reduce((acc, r) => acc + r.durasiKerja, 0)
    const hariMasuk = milik.filter((r) => r.jamMasuk).length
    const menitTelat = milik.reduce((acc, r) => acc + r.menitTelat, 0)
    const lemburMenit = milik.reduce((acc, r) => acc + r.lemburMenit, 0)

    // Jam kerja efektif untuk hari ini (display).
    const hariIni = tanggalHariIniWib()
    const jamKerja = jamKerjaUntuk(konteks, p, hariIni)
    const durasiTarget = durasiTargetMenit(
      jamKerja.jamMasuk,
      jamKerja.jamPulang,
      jamKerja.jamIstirahatMulai,
      jamKerja.jamIstirahatSelesai,
    )

    return {
      pegawaiId: p.id,
      nama: p.nama,
      jabatan: p.jabatan,
      noHp: p.noHp,
      jamMasuk: jamKerja.jamMasuk,
      jamPulang: jamKerja.jamPulang,
      jamKerjaManual: Boolean(p.jamMasuk || p.jamPulang),
      sumberJamKerja: jamKerja.sumber,
      namaShift: jamKerja.namaShift,
      hadir,
      telat,
      izin,
      sakit,
      cuti,
      alpa,
      hariMasuk,
      totalCatatan: milik.length,
      rataRataJam: hariMasuk ? Number((totalMenit / hariMasuk / 60).toFixed(2)) : 0,
      durasiTargetJam: Number((durasiTarget / 60).toFixed(2)),
      menitTelat,
      lemburMenit,
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
      if (!adalahHariKerjaTanggal(konteks, tanggal)) continue
      for (const p of pegawaiAktif) {
        if (sudahAda.has(`${p.id}|${t}`)) continue
        jumlahTanpaAbsen++
        if (tanpaAbsen.length < MAKS_BARIS_TANPA_ABSEN) {
          const jamKerja = jamKerjaUntuk(konteks, p, tanggal)
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
            sumber: 'virtual',
            jamKerjaMasuk: jamKerja.jamMasuk,
            jamKerjaPulang: jamKerja.jamPulang,
            hariKe: tanggal.getUTCDay(),
            hariLibur: namaHariLibur(konteks, tanggal),
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
    cuti: rows.filter((r) => r.status === STATUS_CUTI).length,
    alpa: rows.filter((r) => r.status === STATUS_ALPA).length,
    belumPulang: rows.filter((r) => r.jamMasuk && !r.jamPulang).length,
    tanpaAbsen: jumlahTanpaAbsen,
    jumlahPegawai: pegawaiAktif.length,
    hariKerja: jumlahHariKerja(dari, sampai, pengaturan.hariKerja, konteks.hariLibur),
    menitTelat: barisDetail.reduce((acc, r) => acc + r.menitTelat, 0),
    lemburMenit: barisDetail.reduce((acc, r) => acc + r.lemburMenit, 0),
    totalJamKerja: barisDetail.reduce((acc, r) => acc + r.durasiKerja, 0),
  }

  return {
    dari,
    sampai,
    rows: barisDetail,
    summary,
    perPegawai,
    tanpaAbsen,
    pengaturan,
    konteks: { hariLibur: konteks.hariLibur },
  }
}

/**
 * Rekap bulanan per pegawai (dasar penggajian / evaluated kinerja).
 */
export async function rekapBulanan(params: { bulan: string; pegawaiId?: number }) {
  const { dari, sampai } = rentangBulan(params.bulan)
  const { pengaturan, konteks, pegawaiAktif, rows } = await muatData(
    params.pegawaiId ? { ...params, pegawaiId: params.pegawaiId } : {},
    dari,
    sampai,
  )

  const hariKerjaBulan = jumlahHariKerja(dari, sampai, pengaturan.hariKerja, konteks.hariLibur)

  const data = pegawaiAktif.map((p) => {
    const milik = rows.filter((r) => r.pegawaiId === p.id)
    const hitung = (status: string) => milik.filter((r) => r.status === status).length

    let menitTelat = 0
    let lemburMenit = 0
    let totalDurasi = 0
    for (const r of milik) {
      const jamKerja = jamKerjaUntuk(konteks, r.pegawai, r.tanggal)
      const target = durasiTargetMenit(
        jamKerja.jamMasuk,
        jamKerja.jamPulang,
        jamKerja.jamIstirahatMulai,
        jamKerja.jamIstirahatSelesai,
      )
      if (r.jamMasuk) {
        menitTelat += menitKeterlambatan(r.jamMasuk, {
          ...pengaturan,
          jamMasuk: jamKerja.jamMasuk,
          toleransiMenit: jamKerja.toleransiMenit,
        })
      }
      lemburMenit += hitungLemburMenit(r.jamMasuk, r.jamPulang, target)
      if (r.jamMasuk && r.jamPulang) {
        totalDurasi += Math.round((r.jamPulang.getTime() - r.jamMasuk.getTime()) / 60000)
      }
    }

    const hadir = hitung(STATUS_HADIR)
    const telat = hitung(STATUS_TELAT)
    const izin = hitung(STATUS_IZIN)
    const sakit = hitung(STATUS_SAKIT)
    const cuti = hitung(STATUS_CUTI)
    const alpa = hitung(STATUS_ALPA)
    const hariEfektif = hariKerjaBulan - izin - sakit - cuti

    return {
      pegawaiId: p.id,
      nama: p.nama,
      jabatan: p.jabatan,
      hariKerja: hariKerjaBulan,
      hadir,
      telat,
      izin,
      sakit,
      cuti,
      alpa,
      hariEfektif,
      persenKehadiran: hariEfektif > 0 ? Number(((hadir + telat) / hariEfektif * 100).toFixed(1)) : 0,
      menitTelat,
      totalJamKerja: Number((totalDurasi / 60).toFixed(2)),
      lemburJam: Number((lemburMenit / 60).toFixed(2)),
      belumPulang: milik.filter((r) => r.jamMasuk && !r.jamPulang).length,
    }
  })

  return { bulan: params.bulan, dari, sampai, hariKerja: hariKerjaBulan, rows: data }
}

/** Total menit kerja untuk satu pegawai pada satu tanggal (helper rekap). */
export function durasiKerjaMenit(jamMasuk: Date | null, jamPulang: Date | null): number {
  if (!jamMasuk || !jamPulang) return 0
  return Math.round((jamPulang.getTime() - jamMasuk.getTime()) / 60000)
}

export { jamKeMenit }
