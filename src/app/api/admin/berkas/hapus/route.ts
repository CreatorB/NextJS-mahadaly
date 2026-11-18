import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { bulkBerkasSchema } from '@/lib/validations/konten'
import { hapusBerkas } from '@/lib/berkas'
import { catatRiwayat } from '@/lib/riwayat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Hapus beberapa berkas sekaligus (bulk hapus).
 *
 * Body: { paths: [...], paksa?: boolean }
 * Berkas yang masih dirujuk konten (materi/berita/poster) diblokir kecuali
 * `paksa` = true.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const parsed = bulkBerkasSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json(
        fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 },
      )
    }

    const hasil = await hapusBerkas(parsed.data.paths, parsed.data.paksa ?? false)

    await catatRiwayat({
      aksi: 'hapus-berkas',
      entitas: 'berkas',
      entitasId: null,
      sesudah: { terhapus: hasil.terhapus, gagal: hasil.gagal.map((g) => g.path) },
      keterangan: `${hasil.terhapus.length} berkas dihapus`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    const pesan =
      hasil.gagal.length === 0
        ? `${hasil.terhapus.length} berkas dihapus.`
        : `${hasil.terhapus.length} berkas dihapus, ${hasil.gagal.length} gagal.`

    return Response.json(ok({ ...hasil }, pesan))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menghapus berkas.'), { status: 500 })
  }
}
