import Link from 'next/link'
import type { Metadata } from 'next'
import { after } from 'next/server'
import { Newspaper, Camera, Rss } from 'lucide-react'
import { clsx } from 'clsx'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BeritaCard } from '@/components/berita/BeritaCard'
import prisma from '@/lib/prisma'
import { getBeritaFeed, syncInstagramIfStale } from '@/lib/berita'
import { APP_BASE_URL } from '@/lib/berita-seo'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Berita — Asy-Syathiby',
  description:
    'Kabar & kajian terbaru Ma\'had Aly Al-Imam Asy-Syathiby: jadwal kajian, info program HKI & KIAS, serta catatan dari mahadaly.',
  alternates: { canonical: `${APP_BASE_URL}/berita` },
  openGraph: {
    type: 'website',
    title: 'Berita — Ma\'had Aly Asy-Syathiby',
    description: 'Kabar & kajian terbaru Ma\'had Aly Al-Imam Asy-Syathiby.',
    url: `${APP_BASE_URL}/berita`,
    siteName: "Ma'had Aly Al-Imam Asy-Syathiby",
    locale: 'id_ID',
  },
}

const PER_HALAMAN = 12

type Sumber = 'semua' | 'artikel' | 'instagram'

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; sumber?: string; halaman?: string }>
}) {
  const { kategori, sumber, halaman } = await searchParams
  const kategoriList = await prisma.postKategori.findMany({
    where: { tampil: true },
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
  })
  const aktif = kategoriList.find((k) => k.slug === kategori)?.slug

  const sumberDipakai: Sumber = sumber === 'artikel' || sumber === 'instagram' ? sumber : 'semua'
  const halamanKe = Math.max(1, parseInt(halaman ?? '1', 10) || 1)

  after(() => syncInstagramIfStale(aktif).catch((e) => console.error('[instagram-sync]', e)))
  const items = await getBeritaFeed({
    kategori: aktif,
    limit: PER_HALAMAN * halamanKe,
    sumber: sumberDipakai,
  })
  const tampil = items.slice((halamanKe - 1) * PER_HALAMAN, halamanKe * PER_HALAMAN)

  const sumberPilihan: { key: Sumber; label: string; ikon: typeof Newspaper }[] = [
    { key: 'semua', label: 'Semua', ikon: Newspaper },
    { key: 'artikel', label: 'Artikel', ikon: Newspaper },
    { key: 'instagram', label: 'Instagram', ikon: Camera },
  ]

  const tabs = [{ slug: undefined as string | undefined, nama: 'Semua kategori' }, ...kategoriList]

  const qs = (perubahan: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const dasar: Record<string, string | undefined> = {
      kategori: aktif,
      sumber: sumberDipakai === 'semua' ? undefined : sumberDipakai,
      halaman: halamanKe > 1 ? String(halamanKe) : undefined,
    }
    for (const [k, v] of Object.entries({ ...dasar, ...perubahan })) {
      if (v) p.set(k, v)
    }
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-brand-surface py-14 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-primary md:text-4xl">Berita Terbaru</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Kabar, jadwal kajian, dan catatan dari Ma&apos;had Aly Al-Imam Asy-Syathiby.
              </p>
            </div>
            <a
              href="/berita/feed.xml"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-primary hover:text-brand-primary"
            >
              <Rss className="h-4 w-4" /> RSS
            </a>
          </div>

          {/* Filter sumber */}
          <div className="mb-4 flex flex-wrap gap-2">
            {sumberPilihan.map((s) => (
              <Link
                key={s.key}
                href={qs({ sumber: s.key === 'semua' ? undefined : s.key, halaman: undefined })}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold',
                  sumberDipakai === s.key
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-primary',
                )}
              >
                <s.ikon className="h-3.5 w-3.5" /> {s.label}
              </Link>
            ))}
          </div>

          {/* Filter kategori */}
          <div className="mb-8 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t.slug ?? 'semua'}
                href={qs({ kategori: t.slug, halaman: undefined })}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-sm font-semibold',
                  aktif === t.slug
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-primary',
                )}
              >
                {t.nama}
              </Link>
            ))}
          </div>

          {tampil.length === 0 ? (
            <p className="py-16 text-center text-slate-500">Belum ada berita.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tampil.map((item) => (
                <BeritaCard key={item.key} item={item} />
              ))}
            </div>
          )}

          {halamanKe > 1 && (
            <div className="mt-10 flex justify-center">
              <Link
                href={qs({ halaman: String(halamanKe - 1) })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-primary"
              >
                ← Berita sebelumnya
              </Link>
            </div>
          )}

          {tampil.length === PER_HALAMAN && (
            <div className="mt-6 flex justify-center">
              <Link
                href={qs({ halaman: String(halamanKe + 1) })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-primary"
              >
                Berita selanjutnya →
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
