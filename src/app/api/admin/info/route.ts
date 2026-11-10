import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { halamanInfoSchema } from '@/lib/validations/halaman-info'
import {
  buatHalamanInfo,
  getHalamanInfoList,
  sanitizeHalamanInfo,
} from '@/lib/halaman-info'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Halaman informasi publik (info KIAS, panduan, dsb).
 * GET -> daftar halaman info, POST -> buat halaman baru.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const kategori = req.nextUrl.searchParams.get('kategori') ?? undefined
    const daftar = await getHalamanInfoList({ kategori })

    return Response.json(
      ok({
        halamanInfo: daftar.map((h) => ({
          id: h.id,
          slug: h.slug,
          judul: h.judul,
          kategori: h.kategori,
          ringkasan: h.ringkasan,
          urutan: h.urutan,
          tampil: h.tampil,
          updatedAt: h.updatedAt.toISOString(),
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

    const parsed = halamanInfoSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json(
        fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 },
      )
    }

    const d = parsed.data
    const bentrok = await prisma.halamanInfo.findUnique({ where: { slug: d.slug } })
    if (bentrok) return Response.json(fail('Slug halaman sudah dipakai.'), { status: 400 })

    const baru = await buatHalamanInfo({
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
      aksi: 'buat-info',
      entitas: 'halaman_info',
      entitasId: baru.id,
      sesudah: { slug: baru.slug, judul: baru.judul },
      keterangan: `Halaman info "${baru.judul}" dibuat`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: baru.id }, `Halaman "${baru.judul}" dibuat.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat membuat halaman.'), { status: 500 })
  }
}
