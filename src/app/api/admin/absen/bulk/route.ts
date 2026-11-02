import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { SEMUA_STATUS } from '@/lib/absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Aksi = 'set-status' | 'hapus'

interface Body {
  ids?: number[]
  aksi?: Aksi
  status?: string
  keterangan?: string
}

/**
 * POST /api/admin/absen/bulk
 * Aksi massal untuk baris absensi terpilih (koreksi status / hapus catatan).
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Body
  const ids = Array.isArray(body.ids)
    ? body.ids.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : []
  const aksi = body.aksi

  if (ids.length === 0) {
    return Response.json(fail('Pilih minimal satu baris absensi.'), { status: 400 })
  }

  if (aksi === 'set-status') {
    const status = String(body.status ?? '')
    if (!SEMUA_STATUS.includes(status as (typeof SEMUA_STATUS)[number])) {
      return Response.json(fail('Status tidak dikenal.'), { status: 400 })
    }
    const keterangan = String(body.keterangan ?? '').trim().slice(0, 255) || null

    const hasil = await prisma.absensiKerja.updateMany({
      where: { id: { in: ids } },
      data: { status, keterangan },
    })
    return Response.json(
      ok({ affect: hasil.count }, `${hasil.count} baris absensi diubah menjadi "${status}".`),
    )
  }

  if (aksi === 'hapus') {
    const hasil = await prisma.absensiKerja.deleteMany({ where: { id: { in: ids } } })
    return Response.json(ok({ affect: hasil.count }, `${hasil.count} baris absensi dihapus.`))
  }

  return Response.json(fail('Aksi tidak dikenal.'), { status: 400 })
}
