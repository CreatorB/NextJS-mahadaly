import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/berita/kategori/reorder — simpan urutan kategori baru.
 */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { ids?: number[] }
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n) => Number.isFinite(n)) : []
  if (!ids.length) return Response.json(fail('Urutan kosong.'), { status: 400 })

  await prisma.$transaction(
    ids.map((id, i) => prisma.postKategori.update({ where: { id }, data: { urutan: i + 1 } })),
  )

  return Response.json(ok({ count: ids.length }, 'Urutan kategori disimpan'))
}
