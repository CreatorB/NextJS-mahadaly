import defs from '@/lib/konten-defs.json'

/**
 * Definisi konten situs publik — sumber kebenaran tunggal.
 *
 * Isi file `konten-defs.json` dipakai untuk:
 * 1. seed migration (tabel `konten` + `konten_item`),
 * 2. daftar key di panel admin,
 * 3. nilai bawaan saat admin belum mengisi (halaman publik tidak pernah kosong).
 *
 * Modul ini murni (tanpa Prisma) supaya aman di-import komponen client.
 */

export type KontenTipe = 'teks' | 'textarea' | 'wysiwyg' | 'url'

export interface KontenDef {
  key: string
  label: string
  tipe: KontenTipe
  grup: string
  nilai: string
}

export interface GrupDef {
  id: string
  label: string
}

export interface TipeDef {
  id: KontenTipe
  label: string
}

export interface FieldDef {
  name: 'judul' | 'deskripsi' | 'url' | 'ikon' | 'fileUrl' | 'fileName'
  label: string
  tipe: 'teks' | 'textarea' | 'url' | 'ikon' | 'file'
  required?: boolean
  opsi?: string[]
}

export interface DaftarDef {
  grup: string
  label: string
  itemLabel: string
  helper?: string
  fields: FieldDef[]
}

export interface SeedItemDef {
  grup: string
  judul: string
  deskripsi?: string
  url?: string
  ikon?: string
  fileUrl?: string
  fileName?: string
  urutan: number
}

export const GRUP_LIST = defs.grup as GrupDef[]
export const TIPE_LIST = defs.tipe as TipeDef[]
export const KONTEN_DEFS = defs.konten as KontenDef[]
export const DAFTAR_DEFS = defs.daftar as DaftarDef[]
export const SEED_ITEM = defs.seedItem as SeedItemDef[]

export const KONTEN_MAP: Record<string, KontenDef> = Object.fromEntries(
  KONTEN_DEFS.map((d) => [d.key, d]),
)

export const DAFTAR_MAP: Record<string, DaftarDef> = Object.fromEntries(
  DAFTAR_DEFS.map((d) => [d.grup, d]),
)

/** Label grup yang mudah dibaca. */
export function grupLabel(grup: string): string {
  return GRUP_LIST.find((g) => g.id === grup)?.label ?? grup
}

/**
 * Ganti placeholder `{tag}` dengan nilai dari konteks.
 *
 * Contoh: "Uang pangkal {biayaPangkal}" -> "Uang pangkal Rp 5.250.000".
 * Placeholder yang tidak ada di konteks dibiarkan apa adanya supaya admin
 * bisa mengetahuinya.
 */
export function applyTag(nilai: string, tag: Record<string, string | number>): string {
  if (!nilai) return ''
  return nilai.replace(/\{(\w+)\}/g, (m, key: string) => {
    const v = tag[key]
    return v === undefined || v === null ? m : String(v)
  })
}

/** Daftar placeholder yang dipakai di isi konten (untuk petunjuk di panel admin). */
export const TAG_HINT =
  'Placeholder yang bisa dipakai: {biayaDaftar} {biayaPangkal} {biayaSemester} {biayaCicilan} ' +
  '{biayaKiasDaftar} {biayaKiasSarana} {tahunAjaran} {tahunPsb} {jumlahJenjang} {namaJenjang} ' +
  '{jumlahKelas} {narahubung}'
