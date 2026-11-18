import Link from 'next/link'
import { Plus, Camera, ExternalLink, FolderTree, Tags, Download } from 'lucide-react'
import { listBerita, getBeritaFacets, type BeritaListQuery } from '@/lib/berita-admin'
import { BeritaFilters } from './BeritaFilters'
import { BeritaManager } from './BeritaManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Berita — Admin' }

const PARAMETER = [
  'q', 'status', 'kategori', 'tag', 'dari', 'sampai', 'urutkan', 'arah', 'halaman', 'per',
] as const

export default async function AdminBeritaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const get = (k: string) => {
    const v = params[k]
    return Array.isArray(v) ? v[0] : v
  }

  const query: BeritaListQuery = {}
  for (const k of PARAMETER) {
    const v = get(k)
    if (v) query[k] = v
  }

  const [daftar, facets] = await Promise.all([listBerita(query), getBeritaFacets()])

  const queryRingkas = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, string | undefined>

  const kartu = [
    { label: 'Total berita', nilai: facets.kategori.reduce((n, k) => n + k.count, 0), href: '/admin/berita' },
    { label: 'Terbit', nilai: facets.status.published, href: '/admin/berita?status=published' },
    { label: 'Terjadwal', nilai: facets.status.scheduled, href: '/admin/berita?status=scheduled' },
    { label: 'Draft', nilai: facets.status.draft, href: '/admin/berita?status=draft' },
    { label: 'Perlu SEO', nilai: facets.seoRendah, href: '/admin/berita?status=published' },
  ]

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Berita</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola artikel blog: kategori, tag, SEO meta, dan URL. Artikel tampil di Berita Terbaru
            (beranda untuk kategori Ma&apos;had Aly, halaman KIAS untuk KIAS), digabung dengan postingan Instagram.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/berita/export?format=csv"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Ekspor
          </Link>
          <Link
            href="/admin/berita/tag"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Tags className="h-4 w-4" /> Tag
          </Link>
          <Link
            href="/admin/berita/kategori"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FolderTree className="h-4 w-4" /> Kategori
          </Link>
          <Link
            href="/admin/berita/instagram"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Camera className="h-4 w-4" /> Instagram
          </Link>
          <Link
            href="/admin/berita/create"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Tulis Berita
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kartu.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-primary"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand-primary tabular-nums">{k.nilai}</p>
          </Link>
        ))}
      </div>

      <BeritaFilters facets={facets} />

      <BeritaManager
        rows={daftar.rows}
        total={daftar.total}
        page={daftar.page}
        perPage={daftar.perPage}
        totalPages={daftar.totalPages}
        facets={facets}
        query={queryRingkas}
      />

      <p className="flex items-center gap-2 text-xs text-gray-400">
        <ExternalLink className="h-3.5 w-3.5" />
        Artikel yang terbit otomatis masuk sitemap &amp; RSS. Yang ditandai “tanpa index” tidak ikut keduanya.
      </p>
    </div>
  )
}
