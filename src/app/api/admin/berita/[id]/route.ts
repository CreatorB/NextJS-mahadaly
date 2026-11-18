import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { postPatchSchema } from '@/lib/validations/berita'
import { sanitizeKonten, uniquePostSlug } from '@/lib/berita'
import { isReservedSlug } from '@/lib/slug'
import { setPostTags, snapshotRevision } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/berita/:id — sunting artikel.
 * Semua field opsional (dipakai quick edit maupun editor lengkap).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return Response.json(fail('Berita tidak ditemukan'), { status: 404 })

  const parsed = postPatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  // Simpan isi lama ke riwayat revisi sebelum ditimpa.
  await snapshotRevision(id, session.userId, 'Sebelum penyimpanan')

  let slug = existing.slug
  if (d.slug !== undefined && d.slug && d.slug !== existing.slug) {
    slug = await uniquePostSlug(d.slug, id)
    if (isReservedSlug(slug)) {
      return Response.json(fail('Slug itu dipakai halaman lain. Ganti slug artikel.'), { status: 422 })
    }
  }

  let publishedAt = d.publishedAt !== undefined ? (d.publishedAt ? new Date(d.publishedAt) : null) : existing.publishedAt
  if (d.status === 'published' && !publishedAt) publishedAt = new Date()

  const data: Record<string, unknown> = {
    updatedById: session.userId,
  }
  if (d.judul !== undefined) data.judul = d.judul
  if (d.slug !== undefined) data.slug = slug
  if (d.ringkasan !== undefined) data.ringkasan = d.ringkasan || null
  if (d.konten !== undefined) data.konten = sanitizeKonten(d.konten)
  if (d.coverImage !== undefined) data.coverImage = d.coverImage || null
  if (d.coverAlt !== undefined) data.coverAlt = d.coverAlt || null
  if (d.status !== undefined) data.status = d.status
  if (publishedAt !== undefined) data.publishedAt = publishedAt
  if (d.kategoriId !== undefined) data.kategoriId = d.kategoriId
  if (d.authorId !== undefined) data.authorId = d.authorId || null
  if (d.metaTitle !== undefined) data.metaTitle = d.metaTitle || null
  if (d.metaDescription !== undefined) data.metaDescription = d.metaDescription || null
  if (d.focusKeyword !== undefined) data.focusKeyword = d.focusKeyword || null
  if (d.seoKeywords !== undefined) data.seoKeywords = d.seoKeywords || null
  if (d.canonicalUrl !== undefined) data.canonicalUrl = d.canonicalUrl || null
  if (d.noindex !== undefined) data.noindex = d.noindex
  if (d.nofollow !== undefined) data.nofollow = d.nofollow
  if (d.ogImage !== undefined) data.ogImage = d.ogImage || null
  if (d.twitterImage !== undefined) data.twitterImage = d.twitterImage || null
  if (d.schemaJsonLd !== undefined) data.schemaJsonLd = d.schemaJsonLd
  if (d.sticky !== undefined) data.sticky = d.sticky

  const post = await prisma.post.update({ where: { id }, data })

  if (d.tagSlugs !== undefined) await setPostTags(id, d.tagSlugs)

  return Response.json(ok(post, 'Berita diperbarui'))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  await prisma.post.delete({ where: { id } }).catch(() => null)
  return Response.json(ok(null, 'Berita dihapus'))
}
