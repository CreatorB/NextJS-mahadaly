import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail } from '@/types/api'
import { csvText, excelXml, downloadHeaders, exportFileName } from '@/lib/export'
import { buildBeritaWhere, type BeritaListQuery } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const tgl = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '')

/**
 * GET /api/admin/berita/export?format=csv|xls
 * Ekspor daftar berita mengikuti filter yang sedang aktif di panel admin.
 */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Akses ditolak'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const format = (sp.get('format') ?? 'csv').toLowerCase()
  const q: BeritaListQuery = {
    q: sp.get('q') ?? undefined,
    status: sp.get('status') ?? undefined,
    kategori: sp.get('kategori') ?? undefined,
    tag: sp.get('tag') ?? undefined,
    dari: sp.get('dari') ?? undefined,
    sampai: sp.get('sampai') ?? undefined,
    urutkan: sp.get('urutkan') ?? undefined,
    arah: sp.get('arah') ?? undefined,
  }

  const posts = await prisma.post.findMany({
    where: buildBeritaWhere(q),
    orderBy: [{ updatedAt: 'desc' }],
    take: 5000,
    include: {
      kategori: { select: { nama: true } },
      author: { select: { nama: true } },
      tags: { include: { tag: { select: { nama: true } } } },
    },
  })

  const header = [
    'ID', 'Judul', 'Slug', 'Kategori', 'Status', 'Tanggal Terbit',
    'Penulis', 'Tag', 'Kata Kunci Fokus', 'Meta Title', 'Meta Description',
    'URL Kanonik', 'Noindex', 'Sematkan', 'Dilihat', 'Dibuat',
  ]

  const rows = posts.map((p) => [
    p.id,
    p.judul,
    p.slug,
    p.kategori.nama,
    p.status,
    tgl(p.publishedAt),
    p.author?.nama ?? '',
    p.tags.map((t) => t.tag.nama).join('; '),
    p.focusKeyword ?? '',
    p.metaTitle ?? '',
    p.metaDescription ?? '',
    p.canonicalUrl ?? '',
    p.noindex ? 'ya' : 'tidak',
    p.sticky ? 'ya' : 'tidak',
    p.views,
    tgl(p.createdAt),
  ])

  if (format === 'xls') {
    const xml = excelXml('Berita', header, rows)
    return new Response(xml, {
      headers: downloadHeaders(exportFileName('berita', 'xls'), 'application/vnd.ms-excel; charset=utf-8'),
    })
  }

  const csv = csvText(header, rows)
  return new Response(csv, {
    headers: downloadHeaders(exportFileName('berita', 'csv'), 'text/csv; charset=utf-8'),
  })
}
