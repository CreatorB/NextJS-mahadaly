import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { kategoriPatchSchema } from '@/lib/validations/berita'
import { uniqueTaxonomySlug } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const existing = await prisma.postKategori.findUnique({ where: { id } })
  if (!existing) return Response.json(fail('Kategori tidak ditemukan'), { status: 404 })

  const parsed = kategoriPatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  const data: Record<string, unknown> = {}
  if (d.nama !== undefined) data.nama = d.nama
  if (d.slug !== undefined && d.slug && d.slug !== existing.slug) data.slug = await uniqueTaxonomySlug('kategori', d.slug, id)
  if (d.deskripsi !== undefined) data.deskripsi = d.deskripsi || null
  if (d.seoTitle !== undefined) data.seoTitle = d.seoTitle || null
  if (d.seoDescription !== undefined) data.seoDescription = d.seoDescription || null
  if (d.tampil !== undefined) data.tampil = d.tampil
  if (d.urutan !== undefined) data.urutan = d.urutan

  const kategori = await prisma.postKategori.update({ where: { id }, data })
  return Response.json(ok(kategori, 'Kategori diperbarui'))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const dipakai = await prisma.post.count({ where: { kategoriId: id } })
  if (dipakai > 0) {
    return Response.json(
      fail(`Kategori masih dipakai ${dipakai} berita. Pindahkan dulu beritanya ke kategori lain.`),
      { status: 409 },
    )
  }

  await prisma.postKategori.delete({ where: { id } }).catch(() => null)
  return Response.json(ok(null, 'Kategori dihapus'))
}
