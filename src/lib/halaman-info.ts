import prisma from '@/lib/prisma'
import { sanitizeProfilKonten } from '@/lib/profil'

/**
 * Halaman informasi publik yang isinya disunting dari panel admin.
 *
 * Dua kategori:
 * - `KIAS`     -> ditayangkan di /program/kias/[slug] (info KIAS, panduan, PSB).
 * - `MAHADALY` -> halaman umum (mis. visi-misi) bila nanti diperlukan.
 *
 * Isi disimpan sebagai HTML tersanitasi (sama aturan dengan halaman profil),
 * sehingga aman untuk dirender langsung lewat `dangerouslySetInnerHTML`.
 *
 * Konstanta & helper murni ada di `@/lib/halaman-info-shared` supaya bisa dipakai
 * juga oleh komponen client (form admin) tanpa menarik Prisma ke bundler browser.
 */

export {
  KATEGORI_KIAS,
  KATEGORI_MAHADALY,
  KATEGORI_LABEL,
  KATEGORI_LIST,
  isKategoriValid,
  slugify,
} from '@/lib/halaman-info-shared'
export type { Kategori } from '@/lib/halaman-info-shared'

export type HalamanInfoRow = {
  id: number
  slug: string
  judul: string
  kategori: string
  ringkasan: string | null
  konten: string
  urutan: number
  tampil: boolean
  updatedAt: Date
}

/** Sanitasi HTML halaman info (memakai aturan yang sama dengan profil). */
export function sanitizeHalamanInfo(html: string): string {
  return sanitizeProfilKonten(html)
}

/** Daftar halaman info. `hanyaTampil` dipakai untuk halaman publik. */
export async function getHalamanInfoList(opts: {
  kategori?: string
  hanyaTampil?: boolean
} = {}): Promise<HalamanInfoRow[]> {
  const { kategori, hanyaTampil } = opts
  return prisma.halamanInfo.findMany({
    where: {
      ...(kategori ? { kategori } : {}),
      ...(hanyaTampil ? { tampil: true } : {}),
    },
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
  })
}

/** Ambil satu halaman info yang tampil (untuk halaman publik). */
export async function getHalamanInfoBySlug(slug: string): Promise<HalamanInfoRow | null> {
  return prisma.halamanInfo.findFirst({ where: { slug, tampil: true } })
}

/** Ambil satu halaman info apa pun (untuk panel admin). */
export async function getHalamanInfoById(id: number): Promise<HalamanInfoRow | null> {
  return prisma.halamanInfo.findUnique({ where: { id } })
}

/** Slug aman untuk URL: huruf kecil, angka, dan tanda hubung. */
// (implementasi ada di @/lib/halaman-info-shared, di-reekspor di atas)

export type SimpanHalamanInfoInput = {
  judul: string
  slug: string
  kategori: string
  ringkasan: string | null
  konten: string
  urutan: number
  tampil: boolean
  updatedById: number | null
}

/** Buat halaman info baru. */
export async function buatHalamanInfo(data: SimpanHalamanInfoInput) {
  return prisma.halamanInfo.create({
    data: {
      judul: data.judul,
      slug: data.slug,
      kategori: data.kategori,
      ringkasan: data.ringkasan,
      konten: data.konten,
      urutan: data.urutan,
      tampil: data.tampil,
      updatedById: data.updatedById,
    },
  })
}

/** Perbarui halaman info yang sudah ada. */
export async function ubahHalamanInfo(id: number, data: SimpanHalamanInfoInput) {
  return prisma.halamanInfo.update({
    where: { id },
    data: {
      judul: data.judul,
      slug: data.slug,
      kategori: data.kategori,
      ringkasan: data.ringkasan,
      konten: data.konten,
      urutan: data.urutan,
      tampil: data.tampil,
      updatedById: data.updatedById,
    },
  })
}
