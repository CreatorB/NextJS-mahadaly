import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { kontenItemSchema } from '@/lib/validations/konten'
import { DAFTAR_MAP } from '@/lib/konten-shared'
import { getKontenItemById, hapusKontenItem, ubahKontenItem } from '@/lib/konten'
import { hapusBerkasMateriLama } from '@/lib/berkas'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Ubah / hapus satu item daftar konten.
 *
 * Kalau berkas materi diganti, berkas lama (yang diunggah lewat panel ini)
 * otomatis dihapus supaya storage tidak menumpuk.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const { id } = await params
    const numId = Number(id)
    if (!Number.isFinite(numId)) return Response.json(fail('Item tidak ditemukan.'), { status: 404 })

    const parsed = kontenItemSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json(
        fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 },
      )
    }

    const d = parsed.data
    const lama = await getKontenItemById(numId)
    if (!lama) return Response.json(fail('Item tidak ditemukan.'), { status: 404 })

    const tersimpan = await ubahKontenItem(
      numId,
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

    // Berkas materi lama dihapus kalau memang diganti (bukan aset repo di public/).
    if (lama.fileUrl && lama.fileUrl !== tersimpan.fileUrl) {
      await hapusBerkasMateriLama(lama.fileUrl)
    }

    const def = DAFTAR_MAP[d.grup]
    await catatRiwayat({
      aksi: 'ubah-konten-item',
      entitas: 'konten_item',
      entitasId: numId,
      sebelum: { judul: lama.judul, fileUrl: lama.fileUrl, tampil: lama.tampil },
      sesudah: { judul: tersimpan.judul, fileUrl: tersimpan.fileUrl, tampil: tersimpan.tampil },
      keterangan: `${def?.label ?? d.grup} — "${lama.judul}" diubah`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: tersimpan.id }, `"${tersimpan.judul}" tersimpan.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan item.'), { status: 500 })
  }
}

/** Hapus item daftar (beserta berkas materi yang diunggah lewat panel ini). */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const { id } = await params
    const numId = Number(id)
    if (!Number.isFinite(numId)) return Response.json(fail('Item tidak ditemukan.'), { status: 404 })

    const lama = await getKontenItemById(numId)
    if (!lama) return Response.json(fail('Item tidak ditemukan.'), { status: 404 })

    await hapusKontenItem(numId)
    await hapusBerkasMateriLama(lama.fileUrl)

    const def = DAFTAR_MAP[lama.grup]
    await catatRiwayat({
      aksi: 'hapus-konten-item',
      entitas: 'konten_item',
      entitasId: numId,
      sebelum: { judul: lama.judul, grup: lama.grup, fileUrl: lama.fileUrl },
      keterangan: `${def?.label ?? lama.grup} — "${lama.judul}" dihapus`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(ok({ id: numId }, `"${lama.judul}" dihapus.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menghapus item.'), { status: 500 })
  }
}
