import fs from 'fs/promises'
import path from 'path'
import sanitize from 'sanitize-html'
import prisma from '@/lib/prisma'

import { UPLOAD_BASE } from '@/lib/storage'
import { fetchProfilePosts, igEmbedUrl, igPostUrl } from '@/lib/instagram'

const IG_SYNC_INTERVAL_MS = 60 * 60 * 1000

export const BERITA_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** URL publik untuk path relatif di UPLOAD_DIR (dilayani oleh route /uploads/[...path]). */
export function uploadUrl(relPath: string | null | undefined) {
  if (!relPath) return null
  if (/^https?:\/\//.test(relPath) || relPath.startsWith('/')) return relPath
  return `/uploads/${relPath.replace(/\\/g, '/')}`
}

export async function saveBeritaImage(file: File, folder: 'posts', name?: string) {
  const ext = BERITA_IMAGE_TYPES[file.type]
  if (!ext) throw new Error('Format gambar harus JPG, PNG, WEBP, atau GIF')
  if (file.size > 3 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 3 MB')
  const filename = `${name ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}.${ext}`
  const rel = path.posix.join('berita', folder, filename)
  const abs = path.join(UPLOAD_BASE, rel)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()))
  return rel
}

export function sanitizeKonten(html: string) {
  return sanitize(html, {
    allowedTags: [
      'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
      'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitize.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  })
}

export function toPlainText(html: string) {
  const spaced = html.replace(/<(?:\/?(?:p|h[1-6]|li|ul|ol|blockquote|pre|div)|br|hr)[^>]*>/gi, ' ')
  return sanitize(spaced, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim()
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'berita'
}

export async function uniquePostSlug(base: string, excludeId?: number) {
  const root = slugify(base)
  let slug = root
  for (let i = 2; ; i++) {
    const exist = await prisma.post.findUnique({ where: { slug }, select: { id: true } })
    if (!exist || exist.id === excludeId) return slug
    slug = `${root}-${i}`
  }
}

export type BeritaItem =
  | {
      key: string
      source: 'artikel'
      judul: string
      ringkasan: string
      image: string | null
      href: string
      tanggal: Date
      kategori: string
    }
  | {
      key: string
      source: 'instagram'
      shortcode: string
      embedUrl: string
      href: string
      caption: string
      username: string
      tanggal: Date
      kategori: string
    }

/** Feed gabungan artikel (terbit) + postingan Instagram, terbaru dulu. */
export async function getBeritaFeed(opts: { kategori?: string; limit?: number } = {}): Promise<BeritaItem[]> {
  const limit = opts.limit ?? 9
  const kategoriFilter = opts.kategori ? { kategori: { slug: opts.kategori } } : {}

  const [posts, igPosts] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'published', publishedAt: { lte: new Date() }, ...kategoriFilter },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { kategori: true },
    }),
    prisma.instagramPost.findMany({
      where: { isHidden: false, account: { isActive: true, ...kategoriFilter } },
      orderBy: { postedAt: 'desc' },
      take: limit,
      include: { account: { include: { kategori: true } } },
    }),
  ])

  const items: BeritaItem[] = [
    ...posts.map((p) => ({
      key: `post-${p.id}`,
      source: 'artikel' as const,
      judul: p.judul,
      ringkasan: p.ringkasan || toPlainText(p.konten).slice(0, 160),
      image: uploadUrl(p.coverImage),
      href: `/berita/${p.slug}`,
      tanggal: p.publishedAt ?? p.createdAt,
      kategori: p.kategori.nama,
    })),
    ...igPosts
      .filter((g, i, all) => all.findIndex((x) => x.shortcode === g.shortcode) === i)
      .map((g) => ({
      key: `ig-${g.id}`,
      source: 'instagram' as const,
      shortcode: g.shortcode,
      embedUrl: igEmbedUrl(g.shortcode),
      href: igPostUrl(g.shortcode),
      caption: (g.caption ?? '').slice(0, 200),
      username: g.account.username,
      tanggal: g.postedAt,
      kategori: g.account.kategori.nama,
    })),
  ]

  return items.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime()).slice(0, limit)
}

// ------------------------------------------------------------
// Sinkron Instagram dari halaman embed profil publik (lihat lib/instagram.ts).
// ------------------------------------------------------------

export async function syncInstagramAccount(accountId: number) {
  const account = await prisma.instagramAccount.findUnique({ where: { id: accountId } })
  if (!account) return { ok: false, message: 'Akun tidak ditemukan' }

  try {
    const fetched = await fetchProfilePosts(account.username)
    let baru = 0
    for (const m of fetched) {
      const exist = await prisma.instagramPost.findUnique({
        where: { accountId_shortcode: { accountId: account.id, shortcode: m.shortcode } },
      })
      if (exist) {
        await prisma.instagramPost.update({
          where: { id: exist.id },
          data: { caption: m.caption ?? exist.caption, postedAt: m.postedAt ?? exist.postedAt },
        })
      } else {
        await prisma.instagramPost.create({
          data: { shortcode: m.shortcode, accountId: account.id, caption: m.caption, postedAt: m.postedAt ?? new Date(), source: 'auto' },
        })
        baru++
      }
    }
    await prisma.instagramAccount.update({ where: { id: account.id }, data: { lastSyncAt: new Date(), lastError: null } })
    return { ok: true, message: `${fetched.length} postingan terbaca, ${baru} baru` }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await prisma.instagramAccount.update({ where: { id: account.id }, data: { lastSyncAt: new Date(), lastError: message } })
    return { ok: false, message }
  }
}

const syncing = new Set<number>()

/** Sinkron akun yang sudah lewat interval. Dipanggil lewat after() supaya tidak memperlambat halaman. */
export async function syncInstagramIfStale(kategori?: string) {
  const threshold = new Date(Date.now() - IG_SYNC_INTERVAL_MS)
  const accounts = await prisma.instagramAccount.findMany({
    where: {
      isActive: true,
      autoSync: true,
      OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: threshold } }],
      ...(kategori ? { kategori: { slug: kategori } } : {}),
    },
    select: { id: true },
  })
  for (const { id } of accounts) {
    if (syncing.has(id)) continue
    syncing.add(id)
    try {
      await syncInstagramAccount(id)
    } finally {
      syncing.delete(id)
    }
  }
}
