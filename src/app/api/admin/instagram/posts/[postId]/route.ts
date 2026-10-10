import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ postId: string }> }

async function admin(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  return session && session.roleId <= 2 ? session : null
}

/** { isHidden: boolean } — sembunyikan/tampilkan postingan di website. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await admin(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const body = (await req.json()) as { isHidden?: boolean }
  if (typeof body.isHidden !== 'boolean') return Response.json(fail('isHidden wajib boolean'), { status: 422 })
  await prisma.instagramPost.update({ where: { id: Number((await params).postId) }, data: { isHidden: body.isHidden } })
  return Response.json(ok(null))
}

/** Hapus postingan manual. Postingan hasil sinkron sebaiknya disembunyikan (kalau dihapus akan muncul lagi saat sinkron). */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await admin(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  await prisma.instagramPost.delete({ where: { id: Number((await params).postId) } }).catch(() => null)
  return Response.json(ok(null))
}
