import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { tagSchema } from '@/lib/validations/berita'
import { uniqueTaxonomySlug } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/berita/tag — daftar tag + jumlah berita.
 */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const tag = await prisma.postTag.findMany({
    orderBy: { nama: 'asc' },
    include: { _count: { select: { posts: true } } },
  })

  return Response.json(
    ok(
      tag.map((t) => ({
        id: t.id,
        slug: t.slug,
        nama: t.nama,
        deskripsi: t.deskripsi,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        jumlahPost: t._count.posts,
      })),
      `${tag.length} tag`,
    ),
  )
}

/**
 * POST /api/admin/berita/tag — buat tag baru.
 * Dipakai juga dari input tag di editor (Enter untuk tag baru).
 */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = tagSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  const slug = await uniqueTaxonomySlug('tag', d.slug || d.nama)
  const tag = await prisma.postTag.create({
    data: {
      nama: d.nama,
      slug,
      deskripsi: d.deskripsi || null,
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
    },
  })

  return Response.json(ok(tag, `Tag "${tag.nama}" dibuat`))
}
