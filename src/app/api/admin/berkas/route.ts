import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { listBerkas } from '@/lib/berkas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Manajemen berkas (panel admin).
 *
 * Hanya folder yang boleh dikelola: `materi`, `berita`, `events/images`.
 * Folder berkas pendaftar TIDAK ditampilkan di sini.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const ringkasan = await listBerkas()
    return Response.json(
      ok({
        files: ringkasan.files,
        totalUkuran: ringkasan.totalUkuran,
        totalSemua: ringkasan.totalSemua,
        jumlahSemua: ringkasan.jumlahSemua,
        folder: ringkasan.folder,
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
