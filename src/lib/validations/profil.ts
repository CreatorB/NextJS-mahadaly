import { z } from 'zod'
import { youtubeId } from '@/lib/youtube'

export const profilSchema = z.object({
  konten: z
    .string()
    .min(1, 'Konten profil wajib diisi')
    .max(500_000, 'Konten profil terlalu besar'),
  videoUrl: z
    .string()
    .trim()
    .max(255, 'URL video terlalu panjang')
    .optional()
    .nullable()
    .refine(
      (v) => !v || youtubeId(v) !== null,
      'URL video harus berupa tautan YouTube yang valid (mis. https://youtu.be/xxxxxxx)',
    ),
})

export type ProfilInput = z.infer<typeof profilSchema>
