import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { postAutosaveSchema } from '@/lib/validations/berita'
import { sanitizeKonten } from '@/lib/berita'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/admin/berita/:id/autosave
 * Simpan otomatis: hanya isi & meta, status/publikasi tidak tersentuh.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const parsed = postAutosaveSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data

  const data: Record<string, unknown> = { updatedById: session.userId }
  if (d.judul !== undefined) data.judul = d.judul
  if (d.ringkasan !== undefined) data.ringkasan = d.ringkasan || null
  if (d.konten !== undefined) data.konten = sanitizeKonten(d.konten)
  if (d.coverImage !== undefined) data.coverImage = d.coverImage || null
  if (d.coverAlt !== undefined) data.coverAlt = d.coverAlt || null
  if (d.metaTitle !== undefined) data.metaTitle = d.metaTitle || null
  if (d.metaDescription !== undefined) data.metaDescription = d.metaDescription || null
  if (d.focusKeyword !== undefined) data.focusKeyword = d.focusKeyword || null
  if (d.seoKeywords !== undefined) data.seoKeywords = d.seoKeywords || null
  if (d.canonicalUrl !== undefined) data.canonicalUrl = d.canonicalUrl || null

  const post = await prisma.post.update({ where: { id }, data }).catch(() => null)
  if (!post) return Response.json(fail('Berita tidak ditemukan'), { status: 404 })

  return Response.json(ok({ id: post.id, updatedAt: post.updatedAt, savedAt: new Date() }, 'Tersimpan otomatis'))
}
