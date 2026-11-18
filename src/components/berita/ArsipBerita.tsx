import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { uploadUrl } from '@/lib/berita'
import { APP_BASE_URL } from '@/lib/berita-seo'

export interface ArsipItem {
  id: number
  judul: string
  slug: string
  ringkasan: string | null
  coverImage: string | null
  coverAlt: string | null
  publishedAt: Date | null
}

interface Props {
  judul: string
  deskripsi: string | null
  items: ArsipItem[]
  halaman: number
  totalPages: number
  total: number
  basePath: string
  kategori: string
}

/** Daftar artikel pada halaman arsip kategori / tag. */
export function ArsipBerita({ judul, deskripsi, items, halaman, totalPages, total, basePath, kategori }: Props) {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary md:text-4xl">{judul}</h1>
        {deskripsi && <p className="mt-3 max-w-3xl text-slate-600">{deskripsi}</p>}
        <p className="mt-2 text-sm text-slate-500">{total} berita</p>
      </header>

      {items.length === 0 ? (
        <p className="py-16 text-center text-slate-500">Belum ada berita di {kategori}.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/berita/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-brand-surface">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadUrl(p.coverImage)!}
                    alt={p.coverAlt || p.judul}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary">
                    <Newspaper className="h-10 w-10 text-white/60" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  {p.publishedAt?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-brand-primary">{p.judul}</h2>
                {p.ringkasan && <p className="line-clamp-3 flex-1 text-sm text-slate-600">{p.ringkasan}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`${basePath}${basePath.includes('?') ? '&' : '?'}halaman=${n}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                n === halaman
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-primary'
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}

/** Remah roti untuk halaman arsip. */
export function ArsipBreadcrumb({ nama, path }: { nama: string; path: string }) {
  return (
    <nav aria-label="Remah roti" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <Link href="/" className="hover:text-brand-primary">Beranda</Link>
      <span>/</span>
      <Link href="/berita" className="hover:text-brand-primary">Berita</Link>
      <span>/</span>
      <Link href={path} className="font-medium text-slate-700">{nama}</Link>
    </nav>
  )
}

export { APP_BASE_URL }
