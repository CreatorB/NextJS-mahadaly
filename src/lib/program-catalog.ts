import prisma from './prisma'
import { getActiveKiasInfo, getKiasJenisPrograms, getKiasQuota, isKiasPsbOpen } from './kias'

/**
 * Katalog program publik.
 *
 * Sumber kebenaran: tabel `program_katalog` (satu baris = satu program di web publik).
 * Data & daftar Santri TIDAK digabung — Ma'had Aly ada di `santri`, KIAS ada di
 * `kias_santri`. Modul ini menjumlahkan keduanya untuk rekap/filter tanpa
 * memindahkan data (risiko migrasi = 0).
 *
 * Menambah program baru:
 *  1. INSERT baris ke `program_katalog`
 *  2. (opsional) buat route `/program/<slug>` atau pakai yang generic
 */

export type JenisSistem = 'mahadaly' | 'kias'

export type SisaKuota = {
  ikhwan: number | null
  akhwat: number | null
}

export type CatalogProgram = {
  slug: string
  nama: string
  jenjang: string | null
  ringkasan: string | null
  jenisSistem: JenisSistem
  /** Label untuk filter di hub /psb */
  labelFilter: string
  detailUrl: string
  daftarUrl: string
  status: 'Buka' | 'Tutup'
  tahunAjaran: string | null
  biayaDaftar: number | null
  sisaKuota: SisaKuota | null
  /** Total pendaftar sepanjang waktu (semua tahun) */
  jumlahPendaftar: number
  /** Pendaftar pada tahun ajaran yang sedang dibuka */
  pendaftarTahunIni: number
}

export type CatalogRekap = {
  programs: CatalogProgram[]
  /** Total pendaftar seluruh program */
  totalPendaftar: number
  /** Pendaftar tahun ajaran berjalan */
  totalTahunIni: number
  /** Label filter unik untuk tab di hub /psb */
  filters: { key: string; label: string; jumlah: number }[]
  /** Jumlah program yang pendaftaran-nya sedang dibuka */
  programTerbuka: number
}

const DEFAULT_DAFTAR_PATH: Record<JenisSistem, string> = {
  mahadaly: '/psb/daftar',
  kias: '/kias/daftar',
}

/** Placeholder untuk program yang belum punya sumber data (jenis sistem baru). */
const NEUTRAL_DETAIL = {
  status: 'Tutup' as const,
  tahunAjaran: null,
  biayaDaftar: null,
  jumlahPendaftar: 0,
  pendaftarTahunIni: 0,
  sisaKuota: null,
}

function asJenisSistem(value: string): JenisSistem {
  return value === 'kias' ? 'kias' : 'mahadaly'
}

/** Status buka/tutup Ma'had Aly: pakai info_psb (tahun terakhir). */
function isMahadalyOpen(statusPsb: string | undefined, open: Date | null, closed: Date | null, now = new Date()) {
  if (open && closed) return open <= now && now <= closed
  return statusPsb === 'Buka'
}

async function detailMahadaly() {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  const now = new Date()
  const tahun = info?.tahunAjaran ?? null

  const [total, ikhwan, akhwat] = await Promise.all([
    prisma.santri.count(),
    tahun
      ? prisma.santri.count({ where: { tahunPsb: tahun, jk: 'Laki-Laki' } })
      : Promise.resolve(0),
    tahun
      ? prisma.santri.count({ where: { tahunPsb: tahun, jk: 'Perempuan' } })
      : Promise.resolve(0),
  ])

  return {
    status: isMahadalyOpen(info?.statusPsb, info?.datetimeOpen ?? null, info?.datetimeClosed ?? null, now)
      ? ('Buka' as const)
      : ('Tutup' as const),
    tahunAjaran: tahun,
    biayaDaftar: info?.biayaPendaftaran ?? null,
    jumlahPendaftar: total,
    pendaftarTahunIni: tahun ? ikhwan + akhwat : 0,
    sisaKuota: {
      ikhwan: info?.quotaIkhwan == null ? null : Math.max(0, info.quotaIkhwan - ikhwan),
      akhwat: info?.quotaAkhwat == null ? null : Math.max(0, info.quotaAkhwat - akhwat),
    },
  }
}

async function detailKias() {
  const info = await getActiveKiasInfo()
  const [total, quota] = await Promise.all([
    prisma.kiasSantri.count(),
    info ? getKiasQuota(info) : Promise.resolve(null),
  ])

  return {
    status: isKiasPsbOpen(info) ? ('Buka' as const) : ('Tutup' as const),
    tahunAjaran: info?.tahunAjaran ?? null,
    biayaDaftar: info?.biayaPendaftaran ?? null,
    jumlahPendaftar: total,
    pendaftarTahunIni: quota ? quota.ikhwan + quota.akhwat : 0,
    sisaKuota: quota ? { ikhwan: quota.sisaIkhwan, akhwat: quota.sisaAkhwat } : null,
  }
}

/** Daftar program dari katalog, lengkap dengan status, kuota, dan jumlah pendaftar. */
export async function getCatalogPrograms(): Promise<CatalogProgram[]> {
  const rows = await prisma.programCatalog.findMany({
    where: { tampilDiPsb: true },
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
  })

  if (!rows.length) return []

  const [mahadaly, kias] = await Promise.all([detailMahadaly(), detailKias()])

  return rows.map((row) => {
    const raw = row.jenisSistem
    const jenisSistem = asJenisSistem(raw)
    // Program dengan jenis sistem baru (mis. program ketiga di masa depan)
    // belum punya sumber data: tampilkan nol, jangan pinjam angka program lain.
    const detail =
      raw === 'kias' ? kias : raw === 'mahadaly' ? mahadaly : NEUTRAL_DETAIL
    return {
      slug: row.slug,
      nama: row.nama,
      jenjang: row.jenjang,
      ringkasan: row.ringkasan,
      jenisSistem,
      labelFilter: row.labelFilter ?? row.nama,
      detailUrl: `/program/${row.slug}`,
      daftarUrl: row.daftarPath ?? DEFAULT_DAFTAR_PATH[jenisSistem],
      status: detail.status,
      tahunAjaran: detail.tahunAjaran,
      biayaDaftar: detail.biayaDaftar,
      sisaKuota: detail.sisaKuota,
      jumlahPendaftar: detail.jumlahPendaftar,
      pendaftarTahunIni: detail.pendaftarTahunIni,
    }
  })
}

/** Katalog + rekap total (dipakai hub /psb). */
export async function getCatalogRekap(): Promise<CatalogRekap> {
  const programs = await getCatalogPrograms()

  const filterMap = new Map<string, { label: string; jumlah: number }>()
  for (const p of programs) {
    const key = p.jenisSistem
    const prev = filterMap.get(key)
    filterMap.set(key, { label: p.labelFilter, jumlah: (prev?.jumlah ?? 0) + p.jumlahPendaftar })
  }

  return {
    programs,
    totalPendaftar: programs.reduce((a, p) => a + p.jumlahPendaftar, 0),
    totalTahunIni: programs.reduce((a, p) => a + p.pendaftarTahunIni, 0),
    filters: [
      { key: 'semua', label: 'Semua Program', jumlah: programs.reduce((a, p) => a + p.jumlahPendaftar, 0) },
      ...[...filterMap.entries()].map(([key, v]) => ({ key, label: v.label, jumlah: v.jumlah })),
    ],
    programTerbuka: programs.filter((p) => p.status === 'Buka').length,
  }
}

/** Satu program dari katalog (untuk halaman /program/[slug]). */
export async function getCatalogProgram(slug: string): Promise<CatalogProgram | null> {
  const programs = await getCatalogPrograms()
  return programs.find((p) => p.slug === slug) ?? null
}

/** Katalog untuk sitemap & navigasi (tanpa query berat). */
export async function getCatalogSlugs(): Promise<string[]> {
  const rows = await prisma.programCatalog.findMany({
    where: { tampilDiPsb: true },
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
    select: { slug: true },
  })
  return rows.map((r) => r.slug)
}

/** Jumlah jenjang KIAS yang aktif — untuk ringkasan di halaman program KIAS. */
export async function getKiasRingkasan() {
  const jenis = await getKiasJenisPrograms()
  const kelas = jenis.flatMap((j) => j.programs)
  return {
    jumlahJenjang: jenis.length,
    jumlahKelas: kelas.length,
    kelasBuka: kelas.filter((p) => p.statusPsb === 'Buka').length,
  }
}
