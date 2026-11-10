import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { halamanInfoSchema } from '@/lib/validations/halaman-info'
import { getHalamanInfoById, sanitizeHalamanInfo, ubahHalamanInfo } from '@/lib/halaman-info'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/** Ambil satu halaman info (untuk form admin). */
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const { id } = await params
    const numId = Number(id)
    if (!Number.isFinite(numId)) return Response.json(fail('Halaman tidak ditemukan.'), { status: 404 })

    const halaman = await getHalamanInfoById(numId)
    if (!halaman) return Response.json(fail('Halaman tidak ditemukan.'), { status: 404 })

    return Response.json(
      ok({
        id: halaman.id,
        slug: halaman.slug,
        judul: halaman.judul,
        kategori: halaman.kategori,
        ringkasan: halaman.ringkasan,
        konten: halaman.konten,
        urutan: halaman.urutan,
        tampil: halaman.tampil,
        updatedAt: halaman.updatedAt.toISOString(),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}

/** Simpan perubahan halaman info. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const { id } = await params
    const numId = Number(id)
    if (!Number.isFinite(numId)) return Response.json(fail('Halaman tidak ditemukan.'), { status: 404 })

    const parsed = halamanInfoSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json(
        fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 },
      )
    }

    const d = parsed.data
    const bentrok = await prisma.halamanInfo.findFirst({ where: { slug: d.slug, id: { not: numId } } })
    if (bentrok) return Response.json(fail('Slug halaman sudah dipakai.'), { status: 400 })

    const lama = await getHalamanInfoById(numId)
    if (!lama) return Response.json(fail('Halaman tidak ditemukan.'), { status: 404 })

    const tersimpan = await ubahHalamanInfo(numId, {
      judul: d.judul,
      slug: d.slug,
      kategori: d.kategori,
      ringkasan: d.ringkasan?.trim() ? d.ringkasan.trim() : null,
      konten: sanitizeHalamanInfo(d.konten),
      urutan: d.urutan,
      tampil: d.tampil,
      updatedById: session.userId,
    })

    await catatRiwayat({
      aksi: 'ubah-info',
      entitas: 'halaman_info',
      entitasId: numId,
      sebelum: { slug: lama.slug, judul: lama.judul, tampil: lama.tampil },
      sesudah: { slug: tersimpan.slug, judul: tersimpan.judul, tampil: tersimpan.tampil },
      keterangan: `Halaman info "${lama.judul}" diubah`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: tersimpan.id }, `Halaman "${tersimpan.judul}" tersimpan.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan halaman.'), { status: 500 })
  }
}

/** Hapus halaman info. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const { id } = await params
    const numId = Number(id)
    if (!Number.isFinite(numId)) return Response.json(fail('Halaman tidak ditemukan.'), { status: 404 })

    const lama = await getHalamanInfoById(numId)
    if (!lama) return Response.json(fail('Halaman tidak ditemukan.'), { status: 404 })

    await prisma.halamanInfo.delete({ where: { id: numId } })

    await catatRiwayat({
      aksi: 'hapus-info',
      entitas: 'halaman_info',
      entitasId: numId,
      sebelum: { slug: lama.slug, judul: lama.judul },
      keterangan: `Halaman info "${lama.judul}" dihapus`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: numId }, `Halaman "${lama.judul}" dihapus.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menghapus halaman.'), { status: 500 })
  }
}
