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

async function getTag(slug: string) {
  const tag = await prisma.postTag.findUnique({ where: { slug } })
  if (!tag) return null
  return tag
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await getTag((await params).slug)
  if (!tag) return { title: 'Tag tidak ditemukan' }

  const title = tag.seoTitle?.trim() || `${tag.nama} — Berita Ma'had Aly`
  const description =
    tag.seoDescription?.trim() ||
    tag.deskripsi?.trim() ||
    `Kumpulan berita berlabel ${tag.nama} di Ma'had Aly Al-Imam Asy-Syathiby.`

  return {
    title,
    description,
    alternates: { canonical: `${APP_BASE_URL}/berita/tag/${tag.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${APP_BASE_URL}/berita/tag/${tag.slug}`,
      siteName: "Ma'had Aly Al-Imam Asy-Syathiby",
      locale: 'id_ID',
    },
  }
}

export default async function ArsipTagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { halaman } = await searchParams
  const tag = await getTag(slug)
  if (!tag) notFound()

  const halamanKe = Math.max(1, parseInt(halaman ?? '1', 10) || 1)
  const where = {
    status: 'published',
    publishedAt: { lte: new Date() },
    tags: { some: { tagId: tag.id } },
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

  const canonical = `${APP_BASE_URL}/berita/tag/${tag.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: tag.seoTitle?.trim() || tag.nama,
      description: tag.seoDescription?.trim() || tag.deskripsi || `Berita berlabel ${tag.nama}`,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: "Ma'had Aly Al-Imam Asy-Syathiby", url: APP_BASE_URL },
    },
    buildBreadcrumbJsonLd([
      { name: 'Beranda', url: `${APP_BASE_URL}/` },
      { name: 'Berita', url: `${APP_BASE_URL}/berita` },
      { name: tag.nama, url: canonical },
    ]),
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-brand-surface py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <ArsipBreadcrumb nama={tag.nama} path={`/berita/tag/${tag.slug}`} />
          <ArsipBerita
            judul={tag.seoTitle?.trim() || tag.nama}
            deskripsi={tag.deskripsi}
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
            basePath={`/berita/tag/${tag.slug}`}
            kategori={tag.nama}
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
