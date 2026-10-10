import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { postSchema } from '@/lib/validations/berita'
import { sanitizeKonten, uniquePostSlug } from '@/lib/berita'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return Response.json(fail('Berita tidak ditemukan'), { status: 404 })

  const parsed = postSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data
  let publishedAt = d.publishedAt ? new Date(d.publishedAt) : existing.publishedAt
  if (d.status === 'published' && !publishedAt) publishedAt = new Date()

  const post = await prisma.post.update({
    where: { id },
    data: {
      judul: d.judul,
      slug: d.slug && d.slug !== existing.slug ? await uniquePostSlug(d.slug, id) : existing.slug,
      ringkasan: d.ringkasan || null,
      konten: sanitizeKonten(d.konten),
      coverImage: d.coverImage || null,
      status: d.status,
      publishedAt,
      kategoriId: d.kategoriId,
    },
  })
  return Response.json(ok(post, 'Berita diperbarui'))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  await prisma.post.delete({ where: { id } }).catch(() => null)
  return Response.json(ok(null, 'Berita dihapus'))
}
