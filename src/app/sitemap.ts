import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { getCatalogSlugs } from '@/lib/program-catalog'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'

// Sitemap butuh data terbaru (katalog program, berita, event) → render per request,
// bukan saat build (build di CI tidak punya akses ke database).
export const dynamic = 'force-dynamic'

/**
 * Sitemap publik. Halaman yang butuh login / admin tidak ikut (robots.txt juga
 * memblokirnya), supaya crawler tidak.Index halaman kosong.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const statis: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/psb`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/profil`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/berita`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    // CATATAN: /kias tidak ikut karena sudah 308-redirect ke /program/kias.
    // URL hasil redirect tidak boleh masuk sitemap (menyebar sinyal redirect).
  ]

  let programUrls: MetadataRoute.Sitemap = []
  try {
    const slugs = await getCatalogSlugs()
    programUrls = slugs.map((slug) => ({
      url: `${BASE_URL}/program/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }))
  } catch {
    // katalog belum terisi — sitemap tetap valid
  }

  let beritaUrls: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    })
    beritaUrls = posts.map((p) => ({
      url: `${BASE_URL}/berita/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // database belum siap
  }

  let eventUrls: MetadataRoute.Sitemap = []
  try {
    const events = await prisma.event.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })
    eventUrls = events.map((e) => ({
      url: `${BASE_URL}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // database belum siap
  }

  return [...statis, ...programUrls, ...beritaUrls, ...eventUrls]
}
