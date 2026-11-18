import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock, Tag as TagIcon, User, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ShareButtons } from '@/components/berita/ShareButtons'
import { Toc } from '@/components/berita/Toc'
import { ArticleViewTracker } from '@/components/berita/ArticleViewTracker'
import prisma from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { sanitizeKonten, uploadUrl } from '@/lib/berita'
import { buildToc } from '@/lib/toc'
import { countWords, readingMinutes } from '@/lib/seo-score'
import {
  APP_BASE_URL, buildBlogPostingJsonLd, buildBreadcrumbJsonLd, buildPostMetadata,
  canonicalOf, type PostSeo,
} from '@/lib/berita-seo'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const INCLUDE = {
  kategori: { select: { slug: true, nama: true, tampil: true } },
  author: { select: { nama: true } },
  tags: { include: { tag: { select: { slug: true, nama: true } } } },
} satisfies Prisma.PostInclude

type Post = Awaited<ReturnType<typeof getPost>>

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug }, include: INCLUDE })
  if (!post || post.status !== 'published' || !post.publishedAt || post.publishedAt > new Date()) return null
  if (!post.kategori.tampil) return null
  return post
}

function toSeo(post: NonNullable<Post>): PostSeo {
  return {
    slug: post.slug,
    judul: post.judul,
    ringkasan: post.ringkasan,
    konten: post.konten,
    coverImage: post.coverImage,
    coverAlt: post.coverAlt,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    focusKeyword: post.focusKeyword,
    seoKeywords: post.seoKeywords,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
    nofollow: post.nofollow,
    ogImage: post.ogImage,
    twitterImage: post.twitterImage,
    schemaJsonLd: post.schemaJsonLd,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    kategori: post.kategori,
    author: post.author,
    tags: post.tags.map((t) => t.tag),
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return { title: 'Berita tidak ditemukan' }
  return buildPostMetadata(toSeo(post))
}

export default async function BeritaDetailPage({ params }: Props) {
  const post = await getPost((await params).slug)
  if (!post) notFound()

  const seo = toSeo(post)
  const cover = uploadUrl(post.coverImage)
  const { headings, html: htmlToc } = buildToc(sanitizeKonten(post.konten))
  const words = countWords(post.konten)
  const menit = readingMinutes(words)
  const canonical = canonicalOf(seo)

  const [related, sebelum, sesudah] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: 'published',
        publishedAt: { lte: new Date() },
        kategoriId: post.kategoriId,
        id: { not: post.id },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { kategori: { select: { nama: true } } },
    }),
    prisma.post.findFirst({
      where: {
        status: 'published',
        kategoriId: post.kategoriId,
        publishedAt: { lt: post.publishedAt! },
      },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, judul: true },
    }),
    prisma.post.findFirst({
      where: {
        status: 'published',
        kategoriId: post.kategoriId,
        publishedAt: { gt: post.publishedAt! },
      },
      orderBy: { publishedAt: 'asc' },
      select: { slug: true, judul: true },
    }),
  ])

  const breadcrumbs = [
    { name: 'Beranda', url: `${APP_BASE_URL}/` },
    { name: 'Berita', url: `${APP_BASE_URL}/berita` },
    { name: post.kategori.nama, url: `${APP_BASE_URL}/berita/kategori/${post.kategori.slug}` },
  ]

  const jsonLd = post.schemaJsonLd
    ? [buildBlogPostingJsonLd(seo), buildBreadcrumbJsonLd([...breadcrumbs, { name: post.judul, url: canonical }])]
    : [buildBreadcrumbJsonLd([...breadcrumbs, { name: post.judul, url: canonical }])]

  return (
    <>
      <Navbar />
      <ArticleViewTracker slug={post.slug} />
      <main className="bg-white py-10 px-4">
        <article className="mx-auto max-w-6xl">
          {/* Remah roti */}
          <nav aria-label="Remah roti" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {breadcrumbs.map((b, i) => (
              <span key={b.url} className="inline-flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                <Link href={b.url.replace(APP_BASE_URL, '') || '/'} className="hover:text-brand-primary">{b.name}</Link>
              </span>
            ))}
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-medium text-slate-700">{post.judul}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[200px_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-24 xl:self-start">
              <Toc headings={headings} />
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{post.judul}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {post.publishedAt!.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {menit} menit baca
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {post.author?.nama ?? 'Redaksi'}
                </span>
                <Link
                  href={`/berita/kategori/${post.kategori.slug}`}
                  className="rounded-full bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-primary hover:opacity-80"
                >
                  {post.kategori.nama}
                </Link>
              </div>

              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={post.coverAlt || post.judul}
                  className="mt-7 w-full rounded-2xl object-cover"
                />
              )}

              {post.ringkasan && (
                <p className="mt-7 border-l-4 border-brand-light bg-slate-50 px-4 py-3 text-base text-slate-700">
                  {post.ringkasan}
                </p>
              )}

              <div className="prose-berita mt-7" dangerouslySetInnerHTML={{ __html: htmlToc }} />

              {post.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
                  <TagIcon className="h-4 w-4 text-slate-400" />
                  {post.tags.map((t) => (
                    <Link
                      key={t.tag.slug}
                      href={`/berita/tag/${t.tag.slug}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-primary hover:text-brand-primary"
                    >
                      {t.tag.nama}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-6">
                <ShareButtons judul={post.judul} url={canonical} />
              </div>

              {(sebelum || sesudah) && (
                <nav className="mt-8 grid grid-cols-1 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
                  {sebelum && (
                    <Link href={`/berita/${sebelum.slug}`} className="group rounded-xl border border-slate-200 p-4 hover:border-brand-primary">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <ArrowLeft className="h-3.5 w-3.5" /> Artikel sebelumnya
                      </span>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-brand-primary">
                        {sebelum.judul}
                      </p>
                    </Link>
                  )}
                  {sesudah && (
                    <Link href={`/berita/${sesudah.slug}`} className="group rounded-xl border border-slate-200 p-4 text-right hover:border-brand-primary">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        Artikel berikutnya <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-brand-primary">
                        {sesudah.judul}
                      </p>
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="mx-auto mt-14 max-w-6xl border-t border-slate-100 px-4 pt-10">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Berita terbaru di {post.kategori.nama}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/berita/${r.slug}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
                >
                  {r.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={uploadUrl(r.coverImage)!} alt={r.coverAlt || r.judul} loading="lazy" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="aspect-video w-full bg-brand-surface" />
                  )}
                  <div className="p-4">
                    <p className="text-xs text-slate-400">
                      {r.publishedAt!.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-semibold text-slate-800 group-hover:text-brand-primary">{r.judul}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}

      <Footer />
    </>
  )
}
