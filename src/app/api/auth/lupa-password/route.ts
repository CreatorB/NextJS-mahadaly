import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { createResetToken, findPendingRequest, RESET_REQUEST_TYPE } from '@/lib/password-reset'

export const dynamic = 'force-dynamic'

/**
 * Permintaan reset password dari pengguna.
 * Tidak ada mail server di hosting, jadi permintaan ini dicatat di panel admin
 * ("Pengguna & Reset Password") untuk ditindaklanjuti admin (WhatsApp).
 * Balasan selalu sukses supaya email terdaftar tidak bocor ke publik.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@') || email.length > 190) {
    return Response.json(fail('Email tidak valid'), { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (user && user.isActive !== false) {
    const pending = await findPendingRequest(user.id)
    if (!pending) {
      await createResetToken({ userId: user.id, type: RESET_REQUEST_TYPE })
    }
  }

  return Response.json(
    ok(null, 'Permintaan reset password telah dicatat. Admin akan menghubungi Anda. Jika tidak dalam 1x24 jam, hubungi admin via WhatsApp.'),
  )
}
