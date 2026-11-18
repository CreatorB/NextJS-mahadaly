import { z } from 'zod'

export const postStatusSchema = z.enum(['draft', 'published'])

/** Slug artikel: huruf kecil, angka, tanda hubung. */
const slugBase = z
  .string()
  .trim()
  .max(100)
  .regex(/^[a-z0-9-]*$/, 'Slug hanya huruf kecil, angka, dan tanda -')

export const postSchema = z.object({
  judul: z.string().trim().min(3, 'Judul minimal 3 karakter').max(200),
  slug: slugBase.optional(),
  ringkasan: z.string().trim().max(300).optional().nullable(),
  konten: z.string().min(1, 'Konten wajib diisi'),
  coverImage: z.string().max(255).optional().nullable(),
  coverAlt: z.string().trim().max(255).optional().nullable(),
  status: postStatusSchema,
  publishedAt: z.string().datetime().optional().nullable(),
  kategoriId: z.number().int().positive(),
  tagSlugs: z.array(z.string().trim().max(100)).max(20).optional(),
  authorId: z.number().int().positive().optional().nullable(),

  // --- SEO ---
  metaTitle: z.string().trim().max(255).optional().nullable(),
  metaDescription: z.string().trim().max(320).optional().nullable(),
  focusKeyword: z.string().trim().max(100).optional().nullable(),
  seoKeywords: z.string().trim().max(255).optional().nullable(),
  canonicalUrl: z
    .string()
    .trim()
    .max(255)
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'URL kanonik harus diawali http:// atau https://')
    .optional()
    .nullable(),
  noindex: z.boolean().optional(),
  nofollow: z.boolean().optional(),
  ogImage: z.string().max(255).optional().nullable(),
  twitterImage: z.string().max(255).optional().nullable(),
  schemaJsonLd: z.boolean().optional(),

  // --- Manajemen ---
  sticky: z.boolean().optional(),
})

/** Patch = semua field opsional (dipakai quick edit & revisi pulihkan). */
export const postPatchSchema = postSchema.partial()

/** Autosave: hanya isi & meta, tidak menyentuh status/publikasi. */
export const postAutosaveSchema = z.object({
  judul: z.string().trim().max(200).optional(),
  ringkasan: z.string().trim().max(300).nullable().optional(),
  konten: z.string().max(2_000_000).optional(),
  metaTitle: z.string().trim().max(255).nullable().optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  focusKeyword: z.string().trim().max(100).nullable().optional(),
  seoKeywords: z.string().trim().max(255).nullable().optional(),
  canonicalUrl: z.string().trim().max(255).nullable().optional(),
  coverImage: z.string().max(255).nullable().optional(),
  coverAlt: z.string().trim().max(255).nullable().optional(),
})

export const bulkPostSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Pilih minimal satu berita'),
  aksi: z.enum(['publish', 'draft', 'schedule', 'kategori', 'tag', 'sticky', 'unsticky', 'hapus']),
  publishedAt: z.string().datetime().optional(),
  kategoriId: z.number().int().positive().optional(),
  tagSlug: z.string().trim().max(100).optional(),
})

export const kategoriSchema = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  slug: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-z0-9-]*$/, 'Slug hanya huruf kecil, angka, dan tanda -')
    .optional(),
  deskripsi: z.string().trim().max(1000).optional().nullable(),
  seoTitle: z.string().trim().max(255).optional().nullable(),
  seoDescription: z.string().trim().max(320).optional().nullable(),
  tampil: z.boolean().optional(),
  urutan: z.number().int().min(0).max(9999).optional(),
})

export const kategoriPatchSchema = kategoriSchema.partial()

export const tagSchema = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Slug hanya huruf kecil, angka, dan tanda -')
    .optional(),
  deskripsi: z.string().trim().max(1000).optional().nullable(),
  seoTitle: z.string().trim().max(255).optional().nullable(),
  seoDescription: z.string().trim().max(320).optional().nullable(),
})

export const tagPatchSchema = tagSchema.partial()

export type PostInput = z.infer<typeof postSchema>
export type BulkPostInput = z.infer<typeof bulkPostSchema>
export type KategoriInput = z.infer<typeof kategoriSchema>
export type TagInput = z.infer<typeof tagSchema>
