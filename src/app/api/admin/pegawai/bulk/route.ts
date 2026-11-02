import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { PASSWORD_DEFAULT_PEGAWAI, bersihkanDataPegawai } from '@/lib/pegawai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Aksi =
  | 'aktifkan'
  | 'nonaktifkan'
  | 'reset-password'
  | 'set-jabatan'
  | 'set-jam-kerja'
  | 'reset-jam-kerja'

interface Body {
  ids?: number[]
  aksi?: Aksi
  jabatan?: string
  jamMasuk?: string
  jamPulang?: string
  toleransiMenit?: number
}

/**
 * POST /api/admin/pegawai/bulk
 * Aksi massal untuk pegawai terpilih (bulk update by seleksi).
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Body
  const ids = Array.isArray(body.ids) ? body.ids.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : []
  const aksi = body.aksi

  if (ids.length === 0) {
    return Response.json(fail('Pilih minimal satu pegawai.'), { status: 400 })
  }
  if (!aksi) {
    return Response.json(fail('Aksi tidak ditemukan.'), { status: 400 })
  }

  const pegawai = await prisma.pegawai.findMany({
    where: { id: { in: ids } },
    include: { user: { select: { id: true } } },
  })
  if (pegawai.length === 0) {
    return Response.json(fail('Data pegawai tidak ditemukan.'), { status: 404 })
  }

  let affect = 0

  switch (aksi) {
    case 'aktifkan': {
      const hasil = await prisma.pegawai.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true },
      })
      await prisma.user.updateMany({
        where: { id: { in: pegawai.map((p) => p.userId).filter((v): v is number => v != null) } },
        data: { isActive: true },
      })
      affect = hasil.count
      break
    }

    case 'nonaktifkan': {
      const hasil = await prisma.pegawai.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
      })
      await prisma.user.updateMany({
        where: { id: { in: pegawai.map((p) => p.userId).filter((v): v is number => v != null) } },
        data: { isActive: false },
      })
      affect = hasil.count
      break
    }

    case 'reset-password': {
      const hash = await bcrypt.hash(PASSWORD_DEFAULT_PEGAWAI, 10)
      const userIds = pegawai.map((p) => p.userId).filter((v): v is number => v != null)
      if (userIds.length) {
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { password: hash, passwordChangedAt: new Date() },
        })
      }
      affect = userIds.length
      break
    }

    case 'set-jabatan': {
      const jabatan = String(body.jabatan ?? '').trim()
      if (!jabatan) return Response.json(fail('Jabatan tidak boleh kosong.'), { status: 400 })
      const hasil = await prisma.pegawai.updateMany({
        where: { id: { in: ids } },
        data: { jabatan },
      })
      affect = hasil.count
      break
    }

    case 'set-jam-kerja': {
      const contoh = bersihkanDataPegawai({
        nama: 'x',
        jamMasuk: body.jamMasuk,
        jamPulang: body.jamPulang,
        toleransiMenit: body.toleransiMenit,
      })
      if (!contoh.jamMasuk || !contoh.jamPulang) {
        return Response.json(fail('Jam masuk dan jam pulang wajib diisi.'), { status: 400 })
      }
      const hasil = await prisma.pegawai.updateMany({
        where: { id: { in: ids } },
        data: {
          jamMasuk: contoh.jamMasuk,
          jamPulang: contoh.jamPulang,
          toleransiMenit: contoh.toleransiMenit,
        },
      })
      affect = hasil.count
      break
    }

    case 'reset-jam-kerja': {
      const hasil = await prisma.pegawai.updateMany({
        where: { id: { in: ids } },
        data: { jamMasuk: null, jamPulang: null, toleransiMenit: null },
      })
      affect = hasil.count
      break
    }

    default:
      return Response.json(fail('Aksi tidak dikenal.'), { status: 400 })
  }

  const label: Record<Aksi, string> = {
   aktifkan: 'diaktifkan',
    nonaktifkan: 'dinonaktifkan',
    'reset-password': `password direset ke ${PASSWORD_DEFAULT_PEGAWAI}`,
    'set-jabatan': 'jabatan diperbarui',
    'set-jam-kerja': 'jam kerja diperbarui',
    'reset-jam-kerja': 'jam kerja dikembalikan ke pengaturan global',
  }

  return Response.json(ok({ affect }, `${affect} pegawai berhasil ${label[aksi]}.`))
}
