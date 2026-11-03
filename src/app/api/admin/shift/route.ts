import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  nama?: string
  jamMasuk?: string
  jamPulang?: string
  toleransiMenit?: number
  jamIstirahatMulai?: string | null
  jamIstirahatSelesai?: string | null
  id?: number
}

/**
 * CRUD shift kerja.
 * GET -> daftar shift, PATCH -> ubah shift, DELETE -> hapus shift.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const daftar = await prisma.shift.findMany({
      orderBy: { nama: 'asc' },
      include: { _count: { select: { jadwal: true } } },
    })

    return Response.json(
      ok({
        shift: daftar.map((s) => ({
          id: s.id,
          nama: s.nama,
          jamMasuk: s.jamMasuk,
          jamPulang: s.jamPulang,
          toleransiMenit: s.toleransiMenit,
          jamIstirahatMulai: s.jamIstirahatMulai,
          jamIstirahatSelesai: s.jamIstirahatSelesai,
          isActive: s.isActive,
          jumlahJadwal: s._count.jadwal,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}

function bersihkan(v: unknown): string {
  return String(v ?? '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Body
    const nama = bersihkan(body.nama)
    const jamMasuk = bersihkan(body.jamMasuk) || '07:00:00'
    const jamPulang = bersihkan(body.jamPulang) || '15:00:00'

    if (!nama) return Response.json(fail('Nama shift wajib diisi.'), { status: 400 })

    const bentrok = await prisma.shift.findUnique({ where: { nama } })
    if (bentrok) return Response.json(fail('Nama shift sudah dipakai.'), { status: 400 })

    const shift = await prisma.shift.create({
      data: {
        nama,
        jamMasuk,
        jamPulang,
        toleransiMenit: Number(body.toleransiMenit ?? 5) || 0,
        jamIstirahatMulai: bersihkan(body.jamIstirahatMulai) || null,
        jamIstirahatSelesai: bersihkan(body.jamIstirahatSelesai) || null,
      },
    })

    await catatRiwayat({
      aksi: 'buat-shift',
      entitas: 'jadwal',
      entitasId: shift.id,
      sesudah: { nama, jamMasuk, jamPulang },
      keterangan: `Shift "${nama}" dibuat`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: shift.id }, `Shift "${nama}" dibuat.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat membuat shift.'), { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Body
    const id = Number(body.id)
    if (!Number.isFinite(id)) return Response.json(fail('Shift tidak ditemukan.'), { status: 404 })

    const lama = await prisma.shift.findUnique({ where: { id } })
    if (!lama) return Response.json(fail('Shift tidak ditemukan.'), { status: 404 })

    const data = {
      nama: bersihkan(body.nama) || lama.nama,
      jamMasuk: bersihkan(body.jamMasuk) || lama.jamMasuk,
      jamPulang: bersihkan(body.jamPulang) || lama.jamPulang,
      toleransiMenit:
        body.toleransiMenit != null ? Number(body.toleransiMenit) || 0 : lama.toleransiMenit,
      jamIstirahatMulai:
        body.jamIstirahatMulai !== undefined
          ? bersihkan(body.jamIstirahatMulai) || null
          : lama.jamIstirahatMulai,
      jamIstirahatSelesai:
        body.jamIstirahatSelesai !== undefined
          ? bersihkan(body.jamIstirahatSelesai) || null
          : lama.jamIstirahatSelesai,
    }

    const shift = await prisma.shift.update({ where: { id }, data })

    await catatRiwayat({
      aksi: 'ubah-shift',
      entitas: 'jadwal',
      entitasId: id,
      sebelum: {
        nama: lama.nama,
        jamMasuk: lama.jamMasuk,
        jamPulang: lama.jamPulang,
        toleransiMenit: lama.toleransiMenit,
      },
      sesudah: data,
      keterangan: `Shift "${lama.nama}" diubah`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: shift.id }, `Shift "${shift.nama}" diperbarui.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat mengubah shift.'), { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const id = Number(req.nextUrl.searchParams.get('id'))
    if (!Number.isFinite(id)) return Response.json(fail('Shift tidak ditemukan.'), { status: 404 })

    const lama = await prisma.shift.findUnique({ where: { id } })
    if (!lama) return Response.json(fail('Shift tidak ditemukan.'), { status: 404 })

    await prisma.shift.delete({ where: { id } })

    await catatRiwayat({
      aksi: 'hapus-shift',
      entitas: 'jadwal',
      entitasId: id,
      sebelum: { nama: lama.nama },
      keterangan: `Shift "${lama.nama}" dihapus`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id }, `Shift "${lama.nama}" dihapus.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menghapus shift.'), { status: 500 })
  }
}
