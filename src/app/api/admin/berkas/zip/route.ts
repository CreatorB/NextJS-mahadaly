import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail } from '@/types/api'
import { bulkBerkasSchema } from '@/lib/validations/konten'
import { bacaBerkas, bolehDikelola } from '@/lib/berkas'
import { buatZip } from '@/lib/zip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Unduh beberapa berkas sekaligus (bulk ZIP).
 *
 * Body: { paths: ["materi/a.pdf", ...] }
 * Balasan: berkas ZIP (application/zip) sebagai attachment.
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

    const entries = []
    const gagal: string[] = []
    for (const p of parsed.data.paths) {
      if (!bolehDikelola(p)) {
        gagal.push(p)
        continue
      }
      const data = await bacaBerkas(p)
      if (!data) {
        gagal.push(p)
        continue
      }
      // Struktur folder dipertahankan di dalam ZIP supaya nama berkas tetap unik.
      entries.push({ name: p.replace(/\\/g, '/'), data })
    }

    if (!entries.length) {
      return Response.json(fail('Tidak ada berkas yang bisa diunduh.'), { status: 404 })
    }

    const zip = buatZip(entries)
    const nama = `mahadaly-berkas-${new Date().toISOString().slice(0, 10)}.zip`

    return new Response(new Uint8Array(zip), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${nama}"`,
        'Content-Length': String(zip.length),
        'X-Berkas-Gagal': String(gagal.length),
      },
    })
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat membuat ZIP.'), { status: 500 })
  }
}
