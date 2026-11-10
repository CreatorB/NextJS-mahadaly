import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { kontenTeksSchema } from '@/lib/validations/konten'
import { KONTEN_MAP } from '@/lib/konten-shared'
import { keDtoKonten, sanitizeKontenNilai } from '@/lib/konten-admin'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Konten teks situs publik.
 *
 * GET -> semua baris `konten` (untuk panel admin).
 * PUT -> simpan satu key (upsert).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const rows = await prisma.konten.findMany({
      orderBy: [{ grup: 'asc' }, { urutan: 'asc' }, { id: 'asc' }],
    })

    return Response.json(ok({ konten: rows.map(keDtoKonten) }))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const parsed = kontenTeksSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json(
        fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 },
      )
    }

    const d = parsed.data
    const def = KONTEN_MAP[d.key]
    if (!def) return Response.json(fail('Key konten tidak dikenal.'), { status: 400 })

    const lama = await prisma.konten.findUnique({ where: { key: d.key } })
    const nilai = sanitizeKontenNilai(d.nilai, def.tipe)
    const tampil = d.tampil ?? lama?.tampil ?? true

    const tersimpan = await prisma.konten.upsert({
      where: { key: d.key },
      create: {
        key: d.key,
        label: def.label,
        tipe: def.tipe,
        grup: def.grup,
        nilai,
        urutan: lama?.urutan ?? 0,
        tampil,
        updatedById: session.userId,
      },
      update: { label: def.label, tipe: def.tipe, grup: def.grup, nilai, tampil, updatedById: session.userId },
    })

    await catatRiwayat({
      aksi: 'ubah-konten',
      entitas: 'konten',
      entitasId: tersimpan.id,
      sebelum: { key: d.key, nilai: lama?.nilai ?? null, tampil: lama?.tampil ?? null },
      sesudah: { key: d.key, nilai, tampil },
      keterangan: `Konten "${def.label}" diubah`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: tersimpan.id }, `"${def.label}" tersimpan.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan konten.'), { status: 500 })
  }
}
