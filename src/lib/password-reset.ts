import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

/**
 * Reset password untuk semua jenis akun (peserta event,Santri PSB, Santri KIAS).
 *
 * Tidak ada mail server di hosting, jadi alurnya:
 * 1. Pengguna kirim permintaan lewat /lupa-password -> token bertipe 'request' (ditandai di panel admin).
 * 2. Admin buka "Pengguna & Reset Password", lalu terbitkan link (token bertipe 'reset')
 *    atau langsung set password sementara.
 * 3. Pengguna buka /reset-password?token=... dan membuat password baru.
 */

export const RESET_REQUEST_TYPE = 'request'
export const RESET_LINK_TYPE = 'reset'

/** Masa berlaku link reset password (jam). */
export const RESET_LINK_TTL_HOURS = 24
/** Masa berlaku permintaan reset yang menunggu admin (hari). */
export const RESET_REQUEST_TTL_DAYS = 7

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

/** Password sementara yang mudah dibaca admin & diketik peserta. */
export function generateTempPassword(length = 8): string {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const angka = '23456789'
  const semua = huruf + angka + huruf.toLowerCase()
  const all = Array.from(crypto.randomBytes(length))
    .map((b) => semua[b % semua.length])
    .join('')
  return all
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/** Buat token reset. type 'request' = permintaan user, 'reset' = link set password baru. */
export async function createResetToken(opts: {
  userId: number
  type: typeof RESET_REQUEST_TYPE | typeof RESET_LINK_TYPE
  createdById?: number | null
  ttlHours?: number
}) {
  const ttlHours = opts.ttlHours ?? (opts.type === RESET_LINK_TYPE ? RESET_LINK_TTL_HOURS : RESET_REQUEST_TTL_DAYS * 24)
  return prisma.passwordResetToken.create({
    data: {
      token: randomToken(),
      type: opts.type,
      userId: opts.userId,
      createdById: opts.createdById ?? null,
      expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000),
    },
  })
}

/** Buat link reset baru dan batalkan link lama yang belum dipakai (satu link aktif per akun). */
export async function issueResetLink(userId: number, createdById: number | null) {
  await prisma.passwordResetToken.updateMany({
    where: { userId, type: RESET_LINK_TYPE, usedAt: null },
    data: { usedAt: new Date() },
  })
  return createResetToken({ userId, type: RESET_LINK_TYPE, createdById })
}

/** Permintaan yang belum ditindaklanjuti admin. */
export async function findPendingRequest(userId: number) {
  return prisma.passwordResetToken.findFirst({
    where: { userId, type: RESET_REQUEST_TYPE, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findValidResetToken(token: string) {
  if (!token) return null
  return prisma.passwordResetToken.findFirst({
    where: { token, type: RESET_LINK_TYPE, usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  })
}

/** Ganti password + catat waktu perubahan (membatalkan sesi lama). */
export async function setUserPassword(userId: number, password: string) {
  const hash = await hashPassword(password)
  return prisma.user.update({
    where: { id: userId },
    data: { password: hash, passwordChangedAt: new Date() },
  })
}

/** Tandai token sudah dipakai (dipakai satu kali). */
export async function consumeToken(tokenId: number) {
  return prisma.passwordResetToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } })
}

/** Base URL aplikasi (untuk link reset). Prioritas: host dari request, lalu env. */
export function appBaseUrl(req?: { headers: Headers }): string {
  const headers = req?.headers
  const fwdHost = headers?.get('x-forwarded-host')
  const host = (fwdHost ? fwdHost.split(',')[0].trim() : headers?.get('host')) || ''
  if (host) {
    let proto = (headers?.get('x-forwarded-proto') || '').split(',')[0].trim()
    if (!proto) proto = /^(localhost|127\.0\.0\.1)/i.test(host) ? 'http' : 'https'
    return `${proto}://${host}`
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://mahadaly.syathiby.id'
}

export function resetLink(baseUrl: string, token: string): string {
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`
}
