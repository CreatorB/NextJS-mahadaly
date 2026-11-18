import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { tagPatchSchema } from '@/lib/validations/berita'
import { uniqueTaxonomySlug } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const existing = await prisma.postTag.findUnique({ where: { id } })
  if (!existing) return Response.json(fail('Tag tidak ditemukan'), { status: 404 })

  const parsed = tagPatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  const data: Record<string, unknown> = {}
  if (d.nama !== undefined) data.nama = d.nama
  if (d.slug !== undefined && d.slug && d.slug !== existing.slug) data.slug = await uniqueTaxonomySlug('tag', d.slug, id)
  if (d.deskripsi !== undefined) data.deskripsi = d.deskripsi || null
  if (d.seoTitle !== undefined) data.seoTitle = d.seoTitle || null
  if (d.seoDescription !== undefined) data.seoDescription = d.seoDescription || null

  const tag = await prisma.postTag.update({ where: { id }, data })
  return Response.json(ok(tag, 'Tag diperbarui'))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const dipakai = await prisma.postTagOnPost.count({ where: { tagId: id } })
  await prisma.postTag.delete({ where: { id } }).catch(() => null)

  return Response.json(ok({ affect: dipakai }, `Tag dihapus dari ${dipakai} berita`))
}
