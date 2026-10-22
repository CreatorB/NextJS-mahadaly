import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { eventPaymentPath } from '@/lib/events'
import { UPLOAD_MIME } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/** Bukti pembayaran event — admin atau pemilik pendaftaran. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const regId = Number((await params).id)
  if (!Number.isInteger(regId) || regId <= 0) return new Response('Not found', { status: 404 })
  const reg = await prisma.eventRegistration.findUnique({ where: { id: regId }, select: { userId: true, paymentProof: true } })
  if (!reg?.paymentProof) return new Response('Not found', { status: 404 })
  if (session.roleId > 2 && reg.userId !== session.userId) return new Response('Forbidden', { status: 403 })
  const filePath = eventPaymentPath(reg.paymentProof)
  if (!filePath) return new Response('Not found', { status: 404 })
  try {
    const buf = await fs.readFile(filePath)
    const ext = reg.paymentProof.split('.').pop()?.toLowerCase() ?? ''
    return new Response(buf, { headers: { 'Content-Type': UPLOAD_MIME[ext] ?? 'application/octet-stream', 'Cache-Control': 'private, no-store' } })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
