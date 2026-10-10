import Link from 'next/link'
import type { Metadata } from 'next'
import { after } from 'next/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BeritaCard } from '@/components/berita/BeritaCard'
import prisma from '@/lib/prisma'
import { getBeritaFeed, syncInstagramIfStale } from '@/lib/berita'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: "Berita — Asy-Syathiby" }

export default async function BeritaPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams
  const kategoriList = await prisma.postKategori.findMany({ orderBy: { id: 'asc' } })
  const aktif = kategoriList.find((k) => k.slug === kategori)?.slug

  after(() => syncInstagramIfStale(aktif).catch((e) => console.error('[instagram-sync]', e)))
  const items = await getBeritaFeed({ kategori: aktif, limit: 30 })

  const tabs = [{ slug: undefined as string | undefined, nama: 'Semua' }, ...kategoriList]

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-brand-surface py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-primary mb-6">Berita Terbaru</h1>
          <div className="mb-8 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t.slug ?? 'semua'}
                href={t.slug ? `/berita?kategori=${t.slug}` : '/berita'}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  aktif === t.slug ? 'bg-brand-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-primary'
                }`}
              >
                {t.nama}
              </Link>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="py-16 text-center text-slate-500">Belum ada berita.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <BeritaCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
