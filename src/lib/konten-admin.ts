import sanitize from 'sanitize-html'
import { KONTEN_MAP } from '@/lib/konten-shared'

/**
 * Helper sisi server untuk panel admin konten situs.
 *
 * Tanggung jawab:
 * - mensanitasi nilai sebelum disimpan ke database,
 * - memetakan baris database ke bentuk yang dipakai UI admin.
 */

/** Tag yang boleh dipakai pada konten tipe `wysiwyg`. */
const WYSIWYG_TAGS = [
  'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
  'a', 'ul', 'ol', 'li', 'blockquote', 'span',
  'h3', 'h4', 'h5', 'img', 'figure', 'figcaption',
]

/**
 * Sanitasi nilai konten sesuai tipenya.
 *
 * - `wysiwyg`: HTML diizinkan, tapi tag/attr di luar daftar dibuang.
 * - `teks` / `textarea` / `url`: HTML dibuang sepenuhnya supaya teks tampil
 *   apa adanya (tidak ada tag yang bocor ke halaman publik).
 */
export function sanitizeKontenNilai(nilai: string, tipe: string): string {
  const v = nilai ?? ''
  if (tipe === 'wysiwyg') {
    return sanitize(v, {
      allowedTags: WYSIWYG_TAGS,
      allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        span: ['class'],
        figure: ['class'],
        figcaption: ['class'],
      },
      allowedSchemes: ['https', 'http', 'mailto'],
      allowedSchemesByTag: { img: ['https', 'http'] },
      allowProtocolRelative: false,
      transformTags: {
        a: sanitize.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
      },
    })
  }
  // Teks biasa: buang tag HTML tanpa mengubah entitas lain (&, <, dst).
  return v.replace(/<[^>]*>/g, '')
}

/** Nilai bawaan (dari definisi) untuk sebuah key. */
export function nilaiBawaan(key: string): string {
  return KONTEN_MAP[key]?.nilai ?? ''
}

/** Bentuk baris `konten` untuk UI admin. */
export function keDtoKonten(row: {
  id: number
  key: string
  label: string
  tipe: string
  grup: string
  nilai: string
  urutan: number
  tampil: boolean
  updatedAt: Date
}) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    tipe: row.tipe,
    grup: row.grup,
    nilai: row.nilai,
    urutan: row.urutan,
    tampil: row.tampil,
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Bentuk baris `konten_item` untuk UI admin. */
export function keDtoItem(row: {
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
}) {
  return {
    id: row.id,
    grup: row.grup,
    judul: row.judul,
    deskripsi: row.deskripsi,
    url: row.url,
    ikon: row.ikon,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    urutan: row.urutan,
    tampil: row.tampil,
    updatedAt: row.updatedAt.toISOString(),
  }
}
