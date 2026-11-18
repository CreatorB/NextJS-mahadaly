import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArsipBerita, ArsipBreadcrumb } from '@/components/berita/ArsipBerita'
import prisma from '@/lib/prisma'
import { APP_BASE_URL, buildBreadcrumbJsonLd } from '@/lib/berita-seo'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ halaman?: string }> }

const PER_HALAMAN = 12

async function getKategori(slug: string) {
  const kategori = await prisma.postKategori.findUnique({ where: { slug } })
  if (!kategori || !kategori.tampil) return null
  return kategori
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const kategori = await getKategori((await params).slug)
  if (!kategori) return { title: 'Kategori tidak ditemukan' }

  const title = kategori.seoTitle?.trim() || `${kategori.nama} — Berita Ma'had Aly`
  const description =
    kategori.seoDescription?.trim() ||
    kategori.deskripsi?.trim() ||
    `Kumpulan berita dan kajian terbaru kategori ${kategori.nama} di Ma'had Aly Al-Imam Asy-Syathiby.`

  return {
    title,
    description,
    alternates: { canonical: `${APP_BASE_URL}/berita/kategori/${kategori.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${APP_BASE_URL}/berita/kategori/${kategori.slug}`,
      siteName: "Ma'had Aly Al-Imam Asy-Syathiby",
      locale: 'id_ID',
    },
  }
}

export default async function ArsipKategoriPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { halaman } = await searchParams
  const kategori = await getKategori(slug)
  if (!kategori) notFound()

  const halamanKe = Math.max(1, parseInt(halaman ?? '1', 10) || 1)
  const where = {
    status: 'published',
    publishedAt: { lte: new Date() },
    kategoriId: kategori.id,
  }

  const [total, items] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (halamanKe - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
    }),
  ])

  const canonical = `${APP_BASE_URL}/berita/kategori/${kategori.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: kategori.seoTitle?.trim() || kategori.nama,
      description: kategori.seoDescription?.trim() || kategori.deskripsi || `Berita kategori ${kategori.nama}`,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: "Ma'had Aly Al-Imam Asy-Syathiby", url: APP_BASE_URL },
    },
    buildBreadcrumbJsonLd([
      { name: 'Beranda', url: `${APP_BASE_URL}/` },
      { name: 'Berita', url: `${APP_BASE_URL}/berita` },
      { name: kategori.nama, url: canonical },
    ]),
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-brand-surface py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <ArsipBreadcrumb nama={kategori.nama} path={`/berita/kategori/${kategori.slug}`} />
          <ArsipBerita
            judul={kategori.seoTitle?.trim() || kategori.nama}
            deskripsi={kategori.deskripsi}
            items={items.map((p) => ({
              id: p.id,
              judul: p.judul,
              slug: p.slug,
              ringkasan: p.ringkasan,
              coverImage: p.coverImage,
              coverAlt: p.coverAlt,
              publishedAt: p.publishedAt,
            }))}
            halaman={halamanKe}
            totalPages={Math.max(1, Math.ceil(total / PER_HALAMAN))}
            total={total}
            basePath={`/berita/kategori/${kategori.slug}`}
            kategori={kategori.nama}
          />
        </div>
      </main>

      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}

      <Footer />
    </>
  )
}
