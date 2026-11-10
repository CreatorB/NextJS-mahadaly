import { z } from 'zod'
import { KATEGORI_LIST } from '@/lib/halaman-info-shared'

/** Format slug: huruf kecil, angka, tanda hubung (dipakai di URL). */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const halamanInfoSchema = z.object({
  judul: z
    .string()
    .trim()
    .min(3, 'Judul minimal 3 karakter')
    .max(191, 'Judul terlalu panjang'),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug minimal 3 karakter')
    .max(191, 'Slug terlalu panjang')
    .regex(slugRegex, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  kategori: z
    .string()
    .refine((v) => (KATEGORI_LIST as readonly string[]).includes(v), 'Kategori tidak valid'),
  ringkasan: z
    .string()
    .trim()
    .max(500, 'Ringkasan maksimal 500 karakter')
    .optional()
    .nullable(),
  konten: z
    .string()
    .min(1, 'Isi halaman wajib diisi')
    .max(500_000, 'Isi halaman terlalu besar'),
  urutan: z.number().int().min(0, 'Urutan minimal 0').max(9999, 'Urutan terlalu besar'),
  tampil: z.boolean(),
})

export type HalamanInfoInput = z.infer<typeof halamanInfoSchema>
