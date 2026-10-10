import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface UpdateBody {
  slug: string
  title?: string
  subtitle?: string | null
  description?: string | null
  iconName?: string | null
  buttonLabel?: string | null
  targetUrl?: string
  isActive?: boolean
  displayOrder?: number
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json(fail('Tidak terautentikasi'), { status: 401 })
  }

  let body: UpdateBody
  try {
    body = (await req.json()) as UpdateBody
  } catch {
    return Response.json(fail('Body tidak valid (JSON required)'), { status: 400 })
  }

  if (!body.slug || typeof body.slug !== 'string') {
    return Response.json(fail('slug wajib diisi'), { status: 400 })
  }
  if (body.targetUrl !== undefined && (typeof body.targetUrl !== 'string' || body.targetUrl.length === 0)) {
    return Response.json(fail('targetUrl tidak boleh kosong'), { status: 400 })
  }

  try {
    const existing = await prisma.crossAppCardSetting.findUnique({ where: { slug: body.slug } })
    if (!existing) {
      return Response.json(fail(`Card dengan slug "${body.slug}" tidak ditemukan`), { status: 404 })
    }

    const data: Record<string, unknown> = { updatedById: session.userId }
    if (body.title !== undefined) data.title = body.title
    if (body.subtitle !== undefined) data.subtitle = body.subtitle
    if (body.description !== undefined) data.description = body.description
    if (body.iconName !== undefined) data.iconName = body.iconName
    if (body.buttonLabel !== undefined) data.buttonLabel = body.buttonLabel
    if (body.targetUrl !== undefined) data.targetUrl = body.targetUrl
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.displayOrder !== undefined) data.displayOrder = body.displayOrder

    const updated = await prisma.crossAppCardSetting.update({
      where: { slug: body.slug },
      data,
    })

    return Response.json(ok(updated, 'Card berhasil diperbarui'))
  } catch (e) {
    console.error('[cross-cards PUT]', e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
