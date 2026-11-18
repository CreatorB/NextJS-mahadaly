import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { postSchema } from '@/lib/validations/berita'
import { sanitizeKonten, uniquePostSlug } from '@/lib/berita'
import { isReservedSlug } from '@/lib/slug'
import { listBerita, setPostTags, type BeritaListQuery } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/berita
 * Daftar berita + filter + paginasi (dipakai panel admin).
 */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const q: BeritaListQuery = {
    q: sp.get('q') ?? undefined,
    status: sp.get('status') ?? undefined,
    kategori: sp.get('kategori') ?? undefined,
    tag: sp.get('tag') ?? undefined,
    dari: sp.get('dari') ?? undefined,
    sampai: sp.get('sampai') ?? undefined,
    urutkan: sp.get('urutkan') ?? undefined,
    arah: sp.get('arah') ?? undefined,
    halaman: sp.get('halaman') ?? undefined,
    per: sp.get('per') ?? undefined,
  }

  const hasil = await listBerita(q)
  return Response.json(ok(hasil, `${hasil.total} berita`))
}

/**
 * POST /api/admin/berita — buat artikel baru.
 */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = postSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  const slug = await uniquePostSlug(d.slug || d.judul)
  if (isReservedSlug(slug)) {
    return Response.json(fail('Slug itu dipakai halaman lain. Ganti slug artikel.'), { status: 422 })
  }

  const publishedAt =
    d.status === 'published'
      ? d.publishedAt
        ? new Date(d.publishedAt)
        : new Date()
      : d.publishedAt
        ? new Date(d.publishedAt)
        : null

  const post = await prisma.post.create({
    data: {
      judul: d.judul,
      slug,
      ringkasan: d.ringkasan || null,
      konten: sanitizeKonten(d.konten),
      coverImage: d.coverImage || null,
      coverAlt: d.coverAlt || null,
      status: d.status,
      publishedAt,
      kategoriId: d.kategoriId,
      authorId: d.authorId ?? session.userId,
      updatedById: session.userId,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
      focusKeyword: d.focusKeyword || null,
      seoKeywords: d.seoKeywords || null,
      canonicalUrl: d.canonicalUrl || null,
      noindex: d.noindex ?? false,
      nofollow: d.nofollow ?? false,
      ogImage: d.ogImage || null,
      twitterImage: d.twitterImage || null,
      schemaJsonLd: d.schemaJsonLd ?? true,
      sticky: d.sticky ?? false,
    },
  })

  if (d.tagSlugs?.length) await setPostTags(post.id, d.tagSlugs)

  return Response.json(ok(post, 'Berita tersimpan'))
}
