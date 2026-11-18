import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/kias-admin'
import { ok, fail } from '@/types/api'
import { simpanBerkasMateri } from '@/lib/berkas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Unggah berkas materi (panduan/kalender).
 *
 * Nama berkas otomatis: `mahadaly-<slug judul>-<timestamp>.<ext>`.
 * Berkas lama DIHAPUS saat item materi diganti (lihat route item/[id]).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi(req)
    if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

    const form = await req.formData()
    const file = form.get('file')
    const judul = String(form.get('judul') ?? '').trim()

    if (!(file instanceof File)) return Response.json(fail('Berkas wajib dipilih'), { status: 422 })
    if (!judul) return Response.json(fail('Judul dokumen wajib diisi'), { status: 422 })

    const hasil = await simpanBerkasMateri(file, judul)
    return Response.json(ok(hasil, `Berkas "${hasil.nama}" diunggah.`))
  } catch (e) {
    console.error(e)
    return Response.json(fail(e instanceof Error ? e.message : 'Upload gagal'), { status: 422 })
  }
}
