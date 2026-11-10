import { cache } from 'react'
import prisma from '@/lib/prisma'
import { formatRupiah, getActiveKiasInfo, getKiasJenisPrograms } from '@/lib/kias'
import { KONTEN_DEFS, KONTEN_MAP, applyTag } from '@/lib/konten-shared'

/**
 * Konten situs publik — sisi server.
 *
 * Semua teks naratif di halaman publik diambil dari tabel `konten`
 * (satu baris = satu key). Nilai bawaan dari `konten-defs.json` dipakai
 * sebagai fallback supaya halaman TIDAK PERNAH kosong Even kalau admin belum
 * mengisi apa pun (atau barisnya terhapus).
 *
 * Modul client-safe ada di `@/lib/konten-shared`.
 */

export type KontenRow = {
  id: number
  key: string
  label: string
  tipe: string
  grup: string
  nilai: string
  urutan: number
  tampil: boolean
  updatedAt: Date
}

export type KontenItemRow = {
  id: number
  grup: string
  judul: string
  deskripsi: string | null
  url: string | null
  ikon: string | null
  fileUrl: string | null
  fileName: string | null
  urutan: number
  tampil: boolean
  updatedAt: Date
}

/**
 * Peta key -> nilai. DB menang atas nilai bawaan.
 * Di-cache per request supaya banyak komponen tidak query berulang.
 *
 * Baris dengan `tampil = false` dikembalikan sebagai string kosong supaya
 * admin bisa menyembunyikan teks tanpa mengubah isi aslinya (nilai aslinya
 * tetap tersimpan di database dan bisa dipulihkan kapan saja).
 */
export const getKontenMap = cache(async (): Promise<Record<string, string>> => {
  const map: Record<string, string> = {}
  for (const def of KONTEN_DEFS) map[def.key] = def.nilai

  const rows = await prisma.konten.findMany({
    select: { key: true, nilai: true, tampil: true },
  })
  for (const r of rows) map[r.key] = r.tampil ? r.nilai : ''

  return map
})

/**
 * Nilai satu key + placeholder yang sudah diganti.
 * Kalau key tidak ada, pakai nilai bawaan dari definisi.
 */
export async function getKonten(
  key: string,
  tag: Record<string, string | number> = {},
): Promise<string> {
  const map = await getKontenMap()
  const nilai = map[key] ?? KONTEN_MAP[key]?.nilai ?? ''
  return applyTag(nilai, tag)
}

/**
 * Konteks placeholder dinamis (biaya, tahun ajaran, jumlah jenjang).
 * Nilainya diambil dari data PSB yang sudah ada, jadi admin tidak perlu
 * mengetik ulang nominal yang memang sudah dikelola di Pengaturan PSB.
 */
export const getKontenTag = cache(async (): Promise<Record<string, string>> => {
  const [hki, kias, jenis] = await Promise.all([
    prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } }),
    getActiveKiasInfo(),
    getKiasJenisPrograms(),
  ])

  const kelasBuka = jenis.flatMap((j) => j.programs).filter((p) => p.statusPsb === 'Buka').length

  return {
    biayaDaftar: formatRupiah(hki?.biayaPendaftaran ?? 150000),
    biayaPangkal: formatRupiah(hki?.biayaPangkal ?? 5250000),
    biayaSemester: formatRupiah(hki?.biayaKuliahSemester ?? 3000000),
    biayaCicilan: (hki?.biayaCicilanBulanan ?? 500000).toLocaleString('id-ID'),
    biayaKiasDaftar: formatRupiah(kias?.biayaPendaftaran ?? 150000),
    biayaKiasSarana: formatRupiah(kias?.biayaSaranaPrasarana ?? 300000),
    tahunAjaran: kias?.tahunAjaran ?? hki?.tahunAjaran ?? '',
    tahunPsb: hki?.tahunAjaran ?? '',
    jumlahJenjang: String(jenis.length),
    namaJenjang: jenis.map((j) => j.namaJenis).join(', '),
    jumlahKelas: String(kelasBuka),
  }
})

/** Daftar baris konten (untuk panel admin). */
export async function getKontenRows(grup?: string): Promise<KontenRow[]> {
  return prisma.konten.findMany({
    where: grup ? { grup } : undefined,
    orderBy: [{ grup: 'asc' }, { urutan: 'asc' }, { id: 'asc' }],
  })
}

/** Simpan satu key (upsert). */
export async function upsertKonten(
  data: {
    key: string
    label: string
    tipe: string
    grup: string
    nilai: string
    urutan: number
    tampil: boolean
  },
  updatedById: number | null,
): Promise<KontenRow> {
  return prisma.konten.upsert({
    where: { key: data.key },
    create: { ...data, updatedById },
    update: { ...data, updatedById },
  })
}

/** Daftar item untuk satu grup daftar (publik: hanya yang tampil). */
export async function getKontenItems(
  grup: string,
  opts: { hanyaTampil?: boolean } = {},
): Promise<KontenItemRow[]> {
  return prisma.kontenItem.findMany({
    where: { grup, ...(opts.hanyaTampil ? { tampil: true } : {}) },
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
  })
}

/** Semua item daftar (untuk panel admin). */
export async function getKontenItemAll(): Promise<KontenItemRow[]> {
  return prisma.kontenItem.findMany({
    orderBy: [{ grup: 'asc' }, { urutan: 'asc' }, { id: 'asc' }],
  })
}

export type SimpanKontenItemInput = {
  grup: string
  judul: string
  deskripsi: string | null
  url: string | null
  ikon: string | null
  fileUrl: string | null
  fileName: string | null
  urutan: number
  tampil: boolean
}

export async function buatKontenItem(
  data: SimpanKontenItemInput,
  updatedById: number | null,
): Promise<KontenItemRow> {
  return prisma.kontenItem.create({ data: { ...data, updatedById } })
}

export async function ubahKontenItem(
  id: number,
  data: SimpanKontenItemInput,
  updatedById: number | null,
): Promise<KontenItemRow> {
  return prisma.kontenItem.update({
    where: { id },
    data: { ...data, updatedById },
  })
}

export async function hapusKontenItem(id: number): Promise<KontenItemRow> {
  return prisma.kontenItem.delete({ where: { id } })
}

export async function getKontenItemById(id: number): Promise<KontenItemRow | null> {
  return prisma.kontenItem.findUnique({ where: { id } })
}
