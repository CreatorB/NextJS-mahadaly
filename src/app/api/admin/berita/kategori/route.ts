import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { kategoriSchema } from '@/lib/validations/berita'
import { uniqueTaxonomySlug } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/berita/kategori — daftar kategori + jumlah berita.
 */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const kategori = await prisma.postKategori.findMany({
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { posts: true } } },
  })

  return Response.json(
    ok(
      kategori.map((k) => ({
        id: k.id,
        slug: k.slug,
        nama: k.nama,
        deskripsi: k.deskripsi,
        seoTitle: k.seoTitle,
        seoDescription: k.seoDescription,
        urutan: k.urutan,
        tampil: k.tampil,
        jumlahPost: k._count.posts,
      })),
      `${kategori.length} kategori`,
    ),
  )
}

/**
 * POST /api/admin/berita/kategori — buat kategori berita baru.
 */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = kategoriSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  const slug = await uniqueTaxonomySlug('kategori', d.slug || d.nama)
  const maxUrutan = await prisma.postKategori.aggregate({ _max: { urutan: true } })

  const kategori = await prisma.postKategori.create({
    data: {
      nama: d.nama,
      slug,
      deskripsi: d.deskripsi || null,
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      tampil: d.tampil ?? true,
      urutan: d.urutan ?? (maxUrutan._max.urutan ?? 0) + 1,
    },
  })

  return Response.json(ok(kategori, `Kategori "${kategori.nama}" dibuat`))
}
