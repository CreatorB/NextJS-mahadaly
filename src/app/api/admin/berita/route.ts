import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { postSchema } from '@/lib/validations/berita'
import { sanitizeKonten, uniquePostSlug } from '@/lib/berita'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = postSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const d = parsed.data
  const post = await prisma.post.create({
    data: {
      judul: d.judul,
      slug: await uniquePostSlug(d.slug || d.judul),
      ringkasan: d.ringkasan || null,
      konten: sanitizeKonten(d.konten),
      coverImage: d.coverImage || null,
      status: d.status,
      publishedAt: d.status === 'published' ? (d.publishedAt ? new Date(d.publishedAt) : new Date()) : d.publishedAt ? new Date(d.publishedAt) : null,
      kategoriId: d.kategoriId,
      authorId: session.userId,
    },
  })
  return Response.json(ok(post, 'Berita tersimpan'))
}
