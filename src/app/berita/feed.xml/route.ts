import prisma from '@/lib/prisma'
import { sanitizeKonten } from '@/lib/berita'
import { APP_BASE_URL, SITE_NAME } from '@/lib/berita-seo'

export const dynamic = 'force-dynamic'

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * RSS 2.0 daftar berita terbaru — untuk pembaca & agregator berita.
 * Artikel berstatus "tanpa index" tidak ikut supaya tidak bocor lewat feed.
 */
export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: 'published', publishedAt: { lte: new Date() }, noindex: false },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: { kategori: { select: { nama: true } } },
  })

  const items = posts
    .map((p) => {
      const url = `${APP_BASE_URL}/berita/${p.slug}`
      return `    <item>
      <title>${esc(p.judul)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      <category>${esc(p.kategori.nama)}</category>
      <description>${esc(p.ringkasan ?? '')}</description>
      <content:encoded><![CDATA[${sanitizeKonten(p.konten)}]]></content:encoded>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(SITE_NAME)} — Berita</title>
    <link>${APP_BASE_URL}/berita</link>
    <atom:link href="${APP_BASE_URL}/berita/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Kabar &amp; kajian terbaru Ma'had Aly Al-Imam Asy-Syathiby.</description>
    <language>id-ID</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>next</generator>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
