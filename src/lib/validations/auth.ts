import { z } from 'zod'
import { seemsPhoneNumber } from '@/lib/phone'

/**
 * Login memakai email ATAU nomor WhatsApp.
 * Santri/peserta tetap memakai email; pegawai boleh memakai nomor WA-nya.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(3, 'Email atau nomor WhatsApp wajib diisi')
    .refine(
      (v) => v.includes('@') || seemsPhoneNumber(v),
      'Format email atau nomor WhatsApp tidak valid',
    ),
  password: z.string().min(1, 'Password wajib diisi'),
})

export type LoginFormData = z.infer<typeof loginSchema>
