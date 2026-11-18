import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { snapshotRevision } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; rid: string }> }

/**
 * POST /api/admin/berita/:id/revisions/:rid/restore
 * Pulihkan isi artikel ke satu revisi lama. Isi saat ini disimpan dulu sebagai
 * revisi baru, jadi tidak ada yang hilang.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { id, rid } = await params
  const postId = Number(id)
  const revId = Number(rid)

  const revisi = await prisma.postRevision.findFirst({ where: { id: revId, postId } })
  if (!revisi) return Response.json(fail('Revisi tidak ditemukan'), { status: 404 })

  await snapshotRevision(postId, session.userId, 'Sebelum pemulihan revisi')

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      judul: revisi.judul,
      slug: revisi.slug,
      ringkasan: revisi.ringkasan,
      konten: revisi.konten,
      coverImage: revisi.coverImage,
      status: revisi.status,
      kategoriId: revisi.kategoriId,
      updatedById: session.userId,
    },
  })

  return Response.json(ok(post, 'Artikel dipulihkan ke revisi tersebut'))
}
