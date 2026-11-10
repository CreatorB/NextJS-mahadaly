import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { kontenItemSchema } from '@/lib/validations/konten'
import { DAFTAR_MAP } from '@/lib/konten-shared'
import { buatKontenItem, getKontenItemAll } from '@/lib/konten'
import { keDtoItem } from '@/lib/konten-admin'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Item daftar konten (pengajar, lulusan, kontak, materi, fitur program).
 *
 * GET  -> semua item daftar.
 * POST -> tambah item baru.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const items = await getKontenItemAll()
    return Response.json(ok({ item: items.map(keDtoItem) }))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const parsed = kontenItemSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json(
        fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 },
      )
    }

    const d = parsed.data
    const def = DAFTAR_MAP[d.grup]

    const baru = await buatKontenItem(
      {
        grup: d.grup,
        judul: d.judul,
        deskripsi: d.deskripsi?.trim() ? d.deskripsi.trim() : null,
        url: d.url?.trim() ? d.url.trim() : null,
        ikon: d.ikon?.trim() ? d.ikon.trim() : null,
        fileUrl: d.fileUrl?.trim() ? d.fileUrl.trim() : null,
        fileName: d.fileName?.trim() ? d.fileName.trim() : null,
        urutan: d.urutan,
        tampil: d.tampil,
      },
      session.userId,
    )

    await catatRiwayat({
      aksi: 'buat-konten-item',
      entitas: 'konten_item',
      entitasId: baru.id,
      sesudah: { grup: baru.grup, judul: baru.judul },
      keterangan: `${def?.label ?? d.grup} — "${baru.judul}" ditambahkan`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: baru.id }, `"${baru.judul}" ditambahkan.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menambah item.'), { status: 500 })
  }
}
