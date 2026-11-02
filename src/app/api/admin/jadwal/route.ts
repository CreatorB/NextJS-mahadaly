import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  pegawaiIds?: number[]
  hari?: number
  shiftId?: number | null
}

/**
 * Jadwal shift mingguan per pegawai.
 * GET  -> jadwal seorang pegawai (query: pegawaiId).
 * POST -> set jadwal untuk satu hari (bisa untuk banyak pegawai sekaligus).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const pegawaiId = Number(req.nextUrl.searchParams.get('pegawaiId'))
    if (!Number.isFinite(pegawaiId)) {
      return Response.json(fail('pegawaiId wajib diisi.'), { status: 400 })
    }

    const jadwal = await prisma.jadwalShift.findMany({
      where: { pegawaiId },
      include: { shift: true },
      orderBy: { hari: 'asc' },
    })

    return Response.json(
      ok({
        jadwal: jadwal.map((j) => ({
          hari: j.hari,
          shiftId: j.shiftId,
          namaShift: j.shift.nama,
          jamMasuk: j.shift.jamMasuk,
          jamPulang: j.shift.jamPulang,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Body
    const pegawaiIds = Array.isArray(body.pegawaiIds)
      ? body.pegawaiIds.map((n) => Number(n)).filter((n) => Number.isFinite(n))
      : []
    const hari = Number(body.hari)
    const shiftId = body.shiftId == null ? null : Number(body.shiftId)

    if (pegawaiIds.length === 0) {
      return Response.json(fail('Pilih minimal satu pegawai.'), { status: 400 })
    }
    if (!Number.isFinite(hari) || hari < 0 || hari > 6) {
      return Response.json(fail('Hari tidak valid (0=Minggu ... 6=Sabtu).'), { status: 400 })
    }

    if (shiftId != null) {
      const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
      if (!shift) return Response.json(fail('Shift tidak ditemukan.'), { status: 404 })
    }

    let tersimpan = 0
    for (const pegawaiId of pegawaiIds) {
      if (shiftId == null) {
        await prisma.jadwalShift.deleteMany({ where: { pegawaiId, hari } })
      } else {
        await prisma.jadwalShift.upsert({
          where: { pegawaiId_hari: { pegawaiId, hari } },
          create: { pegawaiId, hari, shiftId },
          update: { shiftId },
        })
      }
      tersimpan++
    }

    await catatRiwayat({
      aksi: 'set-jadwal',
      entitas: 'jadwal',
      sebelum: { hari, pegawaiIds },
      sesudah: { hari, shiftId },
      keterangan: `Jadwal hari ke-${hari} diperbarui untuk ${tersimpan} pegawai`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ affect: tersimpan }, `Jadwal ${tersimpan} pegawai diperbarui.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan jadwal.'), { status: 500 })
  }
}
