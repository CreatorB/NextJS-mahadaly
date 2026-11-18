import { z } from 'zod'
import { DAFTAR_MAP } from '@/lib/konten-shared'

/**
 * Skema validasi panel admin konten situs.
 *
 * `konten`      : satu baris = satu key teks (hero, judul section, footer, dst).
 * `konten_item` : baris daftar (pengajar, lulusan, kontak, materi, fitur program).
 */

/** Simpan satu key teks. */
export const kontenTeksSchema = z.object({
  key: z.string().trim().min(1, 'Key wajib diisi').max(191),
  nilai: z.string().max(200_000, 'Isi terlalu besar'),
  tampil: z.boolean().optional(),
})

/** Simpan satu item daftar. */
export const kontenItemSchema = z.object({
  grup: z
    .string()
    .trim()
    .min(1, 'Grup wajib diisi')
    .max(50)
    .refine((v) => !!DAFTAR_MAP[v], 'Grup daftar tidak dikenal'),
  judul: z.string().trim().min(1, 'Judul wajib diisi').max(191),
  deskripsi: z.string().max(10_000, 'Keterangan terlalu panjang').nullable().optional(),
  url: z.string().max(500, 'Tautan terlalu panjang').nullable().optional(),
  ikon: z.string().max(50).nullable().optional(),
  fileUrl: z.string().max(500).nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
  urutan: z.number().int().min(0, 'Urutan minimal 0').max(9999, 'Urutan terlalu besar'),
  tampil: z.boolean(),
})

export type KontenTeksInput = z.infer<typeof kontenTeksSchema>
export type KontenItemInput = z.infer<typeof kontenItemSchema>

/** Body hapus berkas (bulk). */
export const bulkBerkasSchema = z.object({
  paths: z.array(z.string().min(1).max(300)).min(1, 'Pilih minimal satu berkas').max(200),
  paksa: z.boolean().optional(),
})
