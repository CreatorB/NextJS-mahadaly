import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { catatRiwayat } from '@/lib/riwayat'
import { parseTanggalWib, rentangTanggal } from '@/lib/pengajuan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  tanggal?: string
  tanggalSelesai?: string
  nama?: string
  jenis?: string
}

/**
 * Hari libur / tanggal merah: tidak dihitung sebagai alpa.
 * GET -> daftar (query: dari, sampai) | POST -> tambah | DELETE -> hapus.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const sp = req.nextUrl.searchParams
    const dari = parseTanggalWib(sp.get('dari'))
    const sampai = parseTanggalWib(sp.get('sampai'))

    const daftar = await prisma.hariLibur.findMany({
      where: {
        ...(dari || sampai
          ? {
              tanggal: {
                ...(dari ? { gte: dari } : {}),
                ...(sampai ? { lte: sampai } : {}),
              },
            }
          : {}),
      },
      orderBy: { tanggal: 'asc' },
    })

    return Response.json(
      ok({
        hariLibur: daftar.map((h) => ({
          id: h.id,
          tanggal: h.tanggal.toISOString().slice(0, 10),
          nama: h.nama,
          jenis: h.jenis,
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
    const mulai = parseTanggalWib(body.tanggal)
    if (!mulai) return Response.json(fail('Tanggal tidak valid.'), { status: 400 })

    const nama = String(body.nama ?? '').trim()
    if (!nama) return Response.json(fail('Nama hari libur wajib diisi.'), { status: 400 })

    const jenis = ['libur', 'nasional', 'cuti_umum'].includes(String(body.jenis))
      ? String(body.jenis)
      : 'libur'

    const selesai = parseTanggalWib(body.tanggalSelesai) ?? mulai
    const tanggalList = rentangTanggal(mulai, selesai)

    let dibuat = 0
    for (const tanggal of tanggalList) {
      const ada = await prisma.hariLibur.findUnique({ where: { tanggal } })
      if (ada) {
        await prisma.hariLibur.update({ where: { id: ada.id }, data: { nama, jenis } })
      } else {
        await prisma.hariLibur.create({ data: { tanggal, nama, jenis } })
      }
      dibuat++
    }

    await catatRiwayat({
      aksi: 'set-hari-libur',
      entitas: 'pengaturan',
      entitasId: dibuat,
      sesudah: { mulai: mulai.toISOString().slice(0, 10), selesai: selesai.toISOString().slice(0, 10), nama, jenis },
      keterangan: `Hari libur "${nama}" (${dibuat} tanggal)`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ affect: dibuat }, `${dibuat} tanggal libur disimpan.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan hari libur.'), { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const id = Number(req.nextUrl.searchParams.get('id'))
    if (!Number.isFinite(id)) return Response.json(fail('Data tidak ditemukan.'), { status: 404 })

    const lama = await prisma.hariLibur.findUnique({ where: { id } })
    if (!lama) return Response.json(fail('Data tidak ditemukan.'), { status: 404 })

    await prisma.hariLibur.delete({ where: { id } })

    await catatRiwayat({
      aksi: 'hapus-hari-libur',
      entitas: 'pengaturan',
      entitasId: id,
      sebelum: { tanggal: lama.tanggal.toISOString().slice(0, 10), nama: lama.nama },
      keterangan: `Hari libur "${lama.nama}" dihapus`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id }, 'Hari libur dihapus.'))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menghapus hari libur.'), { status: 500 })
  }
}
