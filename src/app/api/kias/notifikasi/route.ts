import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

/** Tandai notifikasi KIAS milik user dibaca. Body: { id?: number } — tanpa id = semua. */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { id?: number }
  await prisma.kiasNotification.updateMany({
    where: { userId: session.userId, isRead: false, ...(body.id ? { id: Number(body.id) } : {}) },
    data: { isRead: true },
  })
  return Response.json(ok(null))
}
