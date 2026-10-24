import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { listManagedUsers, toManagedUserDTO } from '@/lib/event-users'
import {
  appBaseUrl,
  consumeToken,
  generateTempPassword,
  issueResetLink,
  resetLink as buildResetLink,
  setUserPassword,
} from '@/lib/password-reset'

export const dynamic = 'force-dynamic'

/**
 * Manajemen akun untuk admin.
 * Dipakai untuk kasus:
 * - pendaftar event lupa password (role 4)
 * - Santri (PSB/KIAS) yang sudah punya akun tapi lupa password
 * - akun yang perlu dinonaktifkan
 */
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('temp-password'), userId: z.coerce.number().int(), password: z.string().min(6).max(100).optional() }),
  z.object({ action: z.literal('issue-link'), userId: z.coerce.number().int() }),
  z.object({ action: z.literal('revoke-link'), token: z.string().min(8) }),
  z.object({ action: z.literal('resolve-request'), token: z.string().min(8) }),
  z.object({ action: z.literal('toggle-active'), userId: z.coerce.number().int() }),
])

export async function GET(req: NextRequest) {
  const session = await requireAdminApi(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const rows = await listManagedUsers({
    q: (sp.get('q') ?? '').trim(),
    role: sp.get('role') ?? undefined,
    type: sp.get('type') ?? undefined,
  })

  return Response.json(ok(rows.map(toManagedUserDTO)))
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = actionSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return Response.json(fail('Aksi tidak valid'), { status: 400 })
  const a = parsed.data

  if (a.action === 'revoke-link' || a.action === 'resolve-request') {
    const token = await prisma.passwordResetToken.findUnique({ where: { token: a.token } })
    if (!token) return Response.json(fail('Data tidak ditemukan'), { status: 404 })
    await consumeToken(token.id)
    return Response.json(ok(null, a.action === 'revoke-link' ? 'Link reset password dicabut' : 'Permintaan ditandai selesai'))
  }

  const user = await prisma.user.findUnique({ where: { id: a.userId } })
  if (!user) return Response.json(fail('User tidak ditemukan'), { status: 404 })

  // Admin biasa tidak boleh menyentuh akun admin/superadmin (kecuali akunnya sendiri).
  const isPrivileged = user.roleId <= 2
  if (isPrivileged && session.roleId !== 1 && user.id !== session.userId) {
    return Response.json(fail('Hanya superadmin yang dapat mengelola akun admin'), { status: 403 })
  }

  if (a.action === 'toggle-active') {
    if (user.id === session.userId) {
      return Response.json(fail('Tidak dapat menonaktifkan akun Anda sendiri'), { status: 400 })
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: { isActive: !user.isActive } })
    return Response.json(ok({ id: updated.id, isActive: updated.isActive }, updated.isActive ? 'Akun diaktifkan' : 'Akun dinonaktifkan'))
  }

  if (a.action === 'temp-password') {
    const password = a.password || generateTempPassword()
    await setUserPassword(user.id, password)
    return Response.json(ok({ id: user.id, password }, 'Password sementara berhasil dibuat'))
  }

  if (a.action === 'issue-link') {
    const token = await issueResetLink(user.id, session.userId)
    const base = appBaseUrl({ headers: req.headers })
    return Response.json(
      ok(
        { id: user.id, token: token.token, link: buildResetLink(base, token.token), expiresAt: token.expiresAt },
        'Link reset password dibuat (berlaku 24 jam, sekali pakai)',
      ),
    )
  }

  return Response.json(fail('Aksi tidak dikenal'), { status: 400 })
}
