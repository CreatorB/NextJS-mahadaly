import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { sanitizeKonten } from '@/lib/berita'
import { eventErrors, eventSchema, uniqueEventSlug } from '@/lib/events-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const parsed = eventSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json(fail('Data tidak valid', eventErrors(parsed.error)), { status: 422 })
  const { slug, images, content, ...d } = parsed.data
  const event = await prisma.event.create({
    data: { ...d, slug: await uniqueEventSlug(slug || d.title), content: sanitizeKonten(content), images: JSON.stringify(images) },
  })
  return Response.json(ok({ id: event.id }, 'Event dibuat'), { status: 201 })
}
