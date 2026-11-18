import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { uniquePostSlug } from '@/lib/berita'
import { setPostTags } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/admin/berita/:id/duplicate — salin artikel sebagai draft baru.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const asal = await prisma.post.findUnique({
    where: { id },
    include: { tags: { include: { tag: { select: { slug: true } } } } },
  })
  if (!asal) return Response.json(fail('Berita tidak ditemukan'), { status: 404 })

  const salinan = await prisma.post.create({
    data: {
      judul: `${asal.judul} (salinan)`,
      slug: await uniquePostSlug(`${asal.slug}-salinan`),
      ringkasan: asal.ringkasan,
      konten: asal.konten,
      coverImage: asal.coverImage,
      coverAlt: asal.coverAlt,
      status: 'draft',
      publishedAt: null,
      kategoriId: asal.kategoriId,
      authorId: session.userId,
      updatedById: session.userId,
      metaTitle: asal.metaTitle,
      metaDescription: asal.metaDescription,
      focusKeyword: asal.focusKeyword,
      seoKeywords: asal.seoKeywords,
      canonicalUrl: null,
      noindex: asal.noindex,
      nofollow: asal.nofollow,
      ogImage: asal.ogImage,
      twitterImage: asal.twitterImage,
      schemaJsonLd: asal.schemaJsonLd,
      sticky: false,
      views: 0,
    },
  })

  if (asal.tags.length) {
    await setPostTags(salinan.id, asal.tags.map((t) => t.tag.slug))
  }

  return Response.json(ok(salinan, 'Berita disalin sebagai draft'))
}
