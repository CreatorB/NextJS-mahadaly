import { z } from 'zod'
import prisma from '@/lib/prisma'
import { slugify } from '@/lib/berita'
import { EVENT_STATUS } from '@/lib/events'

const date = z.string().min(1, 'Wajib diisi').transform((v) => new Date(v))
const optDate = z.string().optional().nullable().transform((v) => (v ? new Date(v) : null))
const optInt = z.union([z.literal(''), z.null(), z.coerce.number().int().min(0)]).optional().transform((v) => (v === '' || v == null ? null : v))
const optUrl = z.string().trim().url('Harus URL').max(500).optional().or(z.literal('')).nullable().transform((v) => v || null)

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(255),
    slug: z.string().trim().max(120).regex(/^[a-z0-9-]*$/, 'Slug hanya huruf kecil, angka, dan -').optional(),
    content: z.string().min(1, 'Deskripsi wajib diisi'),
    images: z.array(z.string().max(200)).max(10).default([]),
    startDate: date,
    endDate: date,
    registrationStart: optDate,
    registrationEnd: optDate,
    isPaid: z.boolean(),
    price: z.coerce.number().int().min(0).default(0),
    hasAttendance: z.boolean(),
    hasCertificate: z.boolean(),
    status: z.enum(EVENT_STATUS),
    groupIkhwan: optUrl,
    groupAkhwat: optUrl,
    groupPublic: optUrl,
    quotaIkhwan: optInt,
    quotaAkhwat: optInt,
    autoAccept: z.boolean(),
  })
  .refine((d) => d.endDate >= d.startDate, { path: ['endDate'], message: 'Selesai harus setelah mulai' })
  .refine((d) => !d.registrationStart || !d.registrationEnd || d.registrationEnd >= d.registrationStart, {
    path: ['registrationEnd'], message: 'Tutup pendaftaran harus setelah buka',
  })

export function eventErrors(e: z.ZodError) {
  const errors: Record<string, string[]> = {}
  for (const i of e.issues) errors[i.path.join('.')] = [...(errors[i.path.join('.')] ?? []), i.message]
  return errors
}

export async function uniqueEventSlug(base: string, excludeId?: number) {
  const root = slugify(base)
  let slug = root
  for (let i = 2; ; i++) {
    const exist = await prisma.event.findUnique({ where: { slug }, select: { id: true } })
    if (!exist || exist.id === excludeId) return slug
    slug = `${root}-${i}`
  }
}

