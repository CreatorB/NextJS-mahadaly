import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { sanitizeKonten } from '@/lib/berita'
import { eventErrors, eventSchema, uniqueEventSlug } from '@/lib/events-admin'
import { saveEventFile } from '@/lib/events'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** Ubah event (JSON). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const id = Number((await params).id)
  const existing = await prisma.event.findUnique({ where: { id }, select: { slug: true } })
  if (!existing) return Response.json(fail('Event tidak ditemukan'), { status: 404 })
  const parsed = eventSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json(fail('Data tidak valid', eventErrors(parsed.error)), { status: 422 })
  const { slug, images, content, ...d } = parsed.data
  await prisma.event.update({
    where: { id },
    data: {
      ...d,
      slug: slug && slug !== existing.slug ? await uniqueEventSlug(slug, id) : existing.slug,
      content: sanitizeKonten(content),
      images: JSON.stringify(images),
    },
  })
  return Response.json(ok({ id }, 'Event disimpan'))
}

/**
 * POST multipart `file` = unggah poster (dikembalikan namanya, disimpan lewat PATCH images).
 * POST JSON `{ link: {...} }` = buat link pendaftaran internal.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const id = Number((await params).id)
  if (!(await prisma.event.findUnique({ where: { id }, select: { id: true } }))) return Response.json(fail('Event tidak ditemukan'), { status: 404 })

  if ((req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    const file = (await req.formData()).get('file')
    if (!(file instanceof File)) return Response.json(fail('File wajib diisi'), { status: 422 })
    try {
      return Response.json(ok({ name: await saveEventFile(file, 'images', 3 * 1024 * 1024) }))
    } catch (e) {
      return Response.json(fail(e instanceof Error ? e.message : 'Upload gagal'), { status: 422 })
    }
  }

  const body = z
    .object({
      link: z.object({
        name: z.string().trim().min(2, 'Nama link wajib diisi').max(100),
        quotaIkhwan: z.coerce.number().int().min(0),
        quotaAkhwat: z.coerce.number().int().min(0),
        activeFrom: z.string().optional().nullable().transform((v) => (v ? new Date(v) : null)),
        activeUntil: z.string().optional().nullable().transform((v) => (v ? new Date(v) : null)),
      }),
    })
    .safeParse(await req.json())
  if (!body.success) return Response.json(fail('Data tidak valid', eventErrors(body.error)), { status: 422 })
  const link = await prisma.eventInternalLink.create({
    data: { ...body.data.link, eventId: id, token: randomBytes(16).toString('hex') },
  })
  return Response.json(ok({ id: link.id, token: link.token }, 'Link internal dibuat'), { status: 201 })
}

/** DELETE `?link=<id>` hapus link internal; tanpa query = hapus event beserta pendaftar & absensi. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const id = Number((await params).id)
  const linkId = req.nextUrl.searchParams.get('link')
  if (linkId) {
    await prisma.eventInternalLink.deleteMany({ where: { id: Number(linkId), eventId: id } })
    return Response.json(ok(null, 'Link internal dihapus'))
  }
  await prisma.event.delete({ where: { id } }).catch(() => null)
  return Response.json(ok(null, 'Event dihapus'))
}
