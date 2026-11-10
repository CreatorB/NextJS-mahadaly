/**
 * Konstanta & helper murni untuk "halaman informasi".
 *
 * Dipisah dari `src/lib/halaman-info.ts` supaya modul ini bisa di-import oleh
 * komponen client (form admin) tanpa menarik Prisma ke bundler browser.
 */

export const KATEGORI_KIAS = 'KIAS'
export const KATEGORI_MAHADALY = 'MAHADALY'

export const KATEGORI_LIST = [KATEGORI_KIAS, KATEGORI_MAHADALY] as const
export type Kategori = (typeof KATEGORI_LIST)[number]

/** Label ramah untuk ditampilkan di panel admin. */
export const KATEGORI_LABEL: Record<string, string> = {
  [KATEGORI_KIAS]: 'Info KIAS',
  [KATEGORI_MAHADALY]: 'Umum Ma\u2019had Aly',
}

export function isKategoriValid(value: unknown): value is Kategori {
  return typeof value === 'string' && (KATEGORI_LIST as readonly string[]).includes(value)
}

/** Slug aman untuk URL: huruf kecil, angka, dan tanda hubung. */
export function slugify(judul: string): string {
  return String(judul ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}
