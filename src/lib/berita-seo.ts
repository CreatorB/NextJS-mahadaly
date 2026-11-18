/**
 * Metadata SEO & structured data untuk artikel berita.
 *
 * Semua aturan "nilai efektif" (meta title kosong -> pakai judul, dst.)
 * dikumpulkan di satu tempat supaya halaman publik, pratinjau, sitemap, dan
 * RSS tidak pernah menampilkan nilai yang berbeda.
 */

import type { Metadata } from 'next'
import { toPlainText, uploadUrl } from '@/lib/berita'
import { countWords, readingMinutes } from '@/lib/seo-score'

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'
export const SITE_NAME = "Ma'had Aly Al-Imam Asy-Syathiby"
export const SITE_LOGO = `${APP_BASE_URL}/images/mahadalysyathiby-logo-color.png`

export interface PostSeo {
  slug: string
  judul: string
  ringkasan: string | null
  konten: string
  coverImage: string | null
  coverAlt: string | null
  metaTitle: string | null
  metaDescription: string | null
  focusKeyword: string | null
  seoKeywords: string | null
  canonicalUrl: string | null
  noindex: boolean
  nofollow: boolean
  ogImage: string | null
  twitterImage: string | null
  schemaJsonLd: boolean
  publishedAt: Date | null
  updatedAt: Date
  kategori: { slug: string; nama: string }
  author: { nama: string } | null
  tags: { slug: string; nama: string }[]
}

export function postUrl(slug: string) {
  return `${APP_BASE_URL}/berita/${slug}`
}

/** Pecah daftar keyword bertanda koma jadi array meta keywords. */
export function parseKeywords(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined
  const list = raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  return list.length ? list : undefined
}

export function effectiveTitle(post: Pick<PostSeo, 'judul' | 'metaTitle'>) {
  return post.metaTitle?.trim() || post.judul
}

export function effectiveDescription(post: Pick<PostSeo, 'ringkasan' | 'metaDescription' | 'konten'>) {
  const manual = post.metaDescription?.trim()
  if (manual) return manual
  const ringkasan = post.ringkasan?.trim()
  if (ringkasan) return ringkasan
  return toPlainText(post.konten).slice(0, 158)
}

export function canonicalOf(post: Pick<PostSeo, 'slug' | 'canonicalUrl'>) {
  return post.canonicalUrl?.trim() || postUrl(post.slug)
}

export function buildPostMetadata(post: PostSeo): Metadata {
  const title = effectiveTitle(post)
  const description = effectiveDescription(post)
  const canonical = canonicalOf(post)
  const gambar = uploadUrl(post.ogImage || post.coverImage)
  const twitterGambar = uploadUrl(post.twitterImage || post.coverImage || post.ogImage)
  const keywords = parseKeywords(post.seoKeywords)
  const robots = {
    index: !post.noindex,
    follow: !post.nofollow,
    googleBot: {
      index: !post.noindex,
      follow: !post.nofollow,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  }

  return {
    title,
    description,
    keywords,
    authors: post.author ? [{ name: post.author.nama }] : undefined,
    alternates: { canonical },
    robots,
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'id_ID',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author ? [post.author.nama] : undefined,
      tags: post.tags.length ? post.tags.map((t) => t.nama) : undefined,
      images: gambar ? [{ url: gambar, alt: post.coverAlt || post.judul }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: twitterGambar ? [twitterGambar] : undefined,
    },
  }
}

export function buildBlogPostingJsonLd(post: PostSeo) {
  const canonical = canonicalOf(post)
  const gambar = uploadUrl(post.ogImage || post.coverImage)
  const words = countWords(post.konten)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.judul,
    description: effectiveDescription(post),
    ...(gambar ? { image: [gambar] } : {}),
    datePublished: (post.publishedAt ?? post.updatedAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    ...(post.author
      ? { author: { '@type': 'Person', name: post.author.nama } }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
      url: APP_BASE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: post.kategori.nama,
    ...(parseKeywords(post.seoKeywords) ? { keywords: parseKeywords(post.seoKeywords)!.join(', ') } : {}),
    ...(post.focusKeyword ? { about: post.focusKeyword } : {}),
    wordCount: words,
    timeRequired: `PT${readingMinutes(words)}M`,
    inLanguage: 'id-ID',
  }
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}
