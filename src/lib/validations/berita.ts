import { z } from 'zod'

export const postSchema = z.object({
  judul: z.string().trim().min(3, 'Judul minimal 3 karakter').max(200),
  slug: z.string().trim().max(100).regex(/^[a-z0-9-]*$/, 'Slug hanya huruf kecil, angka, dan tanda -').optional(),
  ringkasan: z.string().trim().max(300).optional().nullable(),
  konten: z.string().min(1, 'Konten wajib diisi'),
  coverImage: z.string().max(255).optional().nullable(),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().datetime().optional().nullable(),
  kategoriId: z.number().int().positive(),
})

export type PostInput = z.infer<typeof postSchema>
