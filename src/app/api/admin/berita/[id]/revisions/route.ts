import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/berita/:id/revisions — riwayat revisi (terbaru dulu).
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const id = Number((await params).id)
  const revisi = await prisma.postRevision.findMany({
    where: { postId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { createdBy: { select: { nama: true } } },
  })

  return Response.json(
    ok(
      revisi.map((r) => ({
        id: r.id,
        judul: r.judul,
        slug: r.slug,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt,
        createdBy: r.createdBy?.nama ?? null,
      })),
      `${revisi.length} revisi`,
    ),
  )
}
