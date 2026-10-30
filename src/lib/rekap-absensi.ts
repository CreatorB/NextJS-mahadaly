/**
 * Rekap absensi kerja untuk panel admin.
 *
 * Query dasar: rentang tanggal (WIB), filter pegawai, filter status.
 * Mengembalikan baris rekap + ringkasan (hadir/telat/izin/sakit/alpa/tidak lengkap).
 */

import prisma from '@/lib/prisma'
import { tanggalHariIniWib } from '@/lib/absensi'

export interface ParamsRekap {
  dari?: string
  sampai?: string
  pegawaiId?: number
  status?: string
}

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
  const dari =
    parseTanggal(params.dari) ??
    new Date(hariIni.getTime() - 29 * 86400000)
  const sampai = parseTanggal(params.sampai) ?? hariIni
  return { dari, sampai }
}

export async function ambilRekap(params: ParamsRekap) {
  const { dari, sampai } = rentangDefault(params)

  const rows = await prisma.absensiKerja.findMany({
    where: {
      tanggal: { gte: dari, lte: sampai },
      ...(params.pegawaiId ? { pegawaiId: params.pegawaiId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: [{ tanggal: 'desc' }, { pegawai: { nama: 'asc' } }],
    include: {
      pegawai: { select: { id: true, nama: true, jabatan: true, noHp: true } },
    },
  })

  const summary = {
    total: rows.length,
    hadir: rows.filter((r) => r.status === 'hadir').length,
    telat: rows.filter((r) => r.status === 'telat').length,
    izin: rows.filter((r) => r.status === 'izin').length,
    sakit: rows.filter((r) => r.status === 'sakit').length,
    alpa: rows.filter((r) => r.status === 'alpa').length,
    belumPulang: rows.filter((r) => r.jamMasuk && !r.jamPulang).length,
  }

  return { dari, sampai, rows, summary }
}
