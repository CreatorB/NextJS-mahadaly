import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { PASSWORD_DEFAULT_PEGAWAI } from '@/lib/pegawai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/pegawai/:id/reset-password
 * Reset password pegawai ke password awal (123456).
 * Sesi lama di perangkat lain otomatis keluar (passwordChangedAt).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const id = Number((await params).id)
  if (!Number.isFinite(id)) return Response.json(fail('ID tidak valid'), { status: 400 })

  const pegawai = await prisma.pegawai.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  })
  if (!pegawai) return Response.json(fail('Pegawai tidak ditemukan'), { status: 404 })
  if (!pegawai.user) {
    return Response.json(fail('Pegawai ini belum punya akun login.'), { status: 400 })
  }

  await prisma.user.update({
    where: { id: pegawai.user.id },
    data: {
      password: await bcrypt.hash(PASSWORD_DEFAULT_PEGAWAI, 10),
      passwordChangedAt: new Date(),
    },
  })

  return Response.json(
    ok(null, `Password ${pegawai.nama} direset ke ${PASSWORD_DEFAULT_PEGAWAI}.`),
  )
}
