/**
 * Client WordPress (syathiby.id) untuk impor artikel ke panel Berita.
 *
 * Pengambilan WAJIB dari sisi server: domain syathiby.id memakai challenge
 * Cloudflare untuk klien biasa (curl dari workstation dapat 202 + halaman
 * challenge), sedangkan dari origin VPS /wp-json bisa diakses normal.
 */

import fs from 'fs/promises'
import path from 'path'
import sanitize from 'sanitize-html'
import { UPLOAD_BASE } from '@/lib/storage'

export const WP_BASE_URL = process.env.WP_BASE_URL ?? 'https://syathiby.id'
const WP_API = `${WP_BASE_URL}/wp-json/wp/v2`
const TIMEOUT_MS = 45_000

export interface WpPostRingkas {
  id: number
  slug: string
  judul: string
  tanggal: string
  excerpt: string
  kategori: { id: number; name: string; slug: string }[]
  tag: { id: number; name: string; slug: string }[]
  coverUrl: string | null
}

export interface WpPostLengkap extends WpPostRingkas {
  kontenHtml: string
  coverUrl: string | null
}

/**
 * Ambil JSON dari WordPress, dengan retry.
 *
 * Origin syathiby.id sering balas **522/524** (Cloudflare gagal menjangkau
 * origin) kalau beberapa permintaan datang bersamaan. Jadi: retry dengan
 * backoff untuk status 5xx/429, dan error 4xx lain langsung dilempar.
 */
async function wpFetch<T>(path: string): Promise<T> {
  let terakhir = 'tidak diketahui'
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${WP_API}${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      })
      if (res.ok) return (await res.json()) as T
      terakhir = `HTTP ${res.status}`
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`WordPress API ${path} -> ${terakhir}`)
      }
    } catch (e) {
      if (e instanceof Error && /-> HTTP 4\d\d/.test(e.message)) throw e
      terakhir = e instanceof Error ? e.message : String(e)
    }
    await new Promise((r) => setTimeout(r, 700 * attempt))
  }
  throw new Error(`WordPress API ${path} -> ${terakhir} (3 percobaan)`)
}

/**
 * Cache in-memory TTL.
 *
 * WordPress syathiby.id hidup di origin lain & memakai Cloudflare — satu
 * permintaan `wp-json` dari VPS bisa 20 detik. Tanpa cache, setiap buka
 * halaman impor menunggu itu lagi. Cache 10 menit cukup: isi artikel
 * WordPress jarang berubah per menit.
 */
const cache = new Map<string, { nilai: unknown; kedaluwarsa: number }>()

async function wpCached<T>(key: string, ttlMs: number, ambil: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const ada = cache.get(key)
  if (ada && ada.kedaluwarsa > now) return ada.nilai as T
  const nilai = await ambil()
  cache.set(key, { nilai, kedaluwarsa: now + ttlMs })
  return nilai
}

const TTL_DAFTAR = 10 * 60 * 1000
const TTL_POST = 10 * 60 * 1000
const TTL_TAKSONOMI = 30 * 60 * 1000

/** Buang tag HTML & decode entity supaya teks aman dipakai di UI/ringkasan. */
export function wpTeks(html: string) {
  return sanitize(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&ldquo;/g, '"')
    .replace(/&#8221;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

interface WpPostApi {
  id: number
  slug: string
  date: string
  title?: { rendered?: string }
  excerpt?: { rendered?: string }
  content?: { rendered?: string }
  featured_media?: number
  categories?: number[]
  tags?: number[]
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string }[] }
}

function coverOf(p: WpPostApi) {
  const media = p._embedded?.['wp:featuredmedia']
  return media?.[0]?.source_url ?? null
}

function petakan(
  p: WpPostApi,
  kategori: Map<number, { id: number; name: string; slug: string }>,
  tag: Map<number, { id: number; name: string; slug: string }>,
): WpPostRingkas {
  return {
    id: p.id,
    slug: p.slug,
    judul: wpTeks(p.title?.rendered ?? ''),
    tanggal: p.date,
    excerpt: wpTeks(p.excerpt?.rendered ?? ''),
    kategori: (p.categories ?? []).map((id) => kategori.get(id)).filter(Boolean) as { id: number; name: string; slug: string }[],
    tag: (p.tags ?? []).map((id) => tag.get(id)).filter(Boolean) as { id: number; name: string; slug: string }[],
    coverUrl: coverOf(p),
  }
}

/** Daftar kategori WordPress (dipakai untuk memetakan kategori tiap artikel). */
async function wpKategori(): Promise<Map<number, { id: number; name: string; slug: string }>> {
  return wpCached('kategori', TTL_TAKSONOMI, async () => {
    const list = await wpFetch<{ id: number; name: string; slug: string }[]>('/categories?per_page=100&_fields=id,name,slug')
    return new Map(list.map((k) => [k.id, k]))
  })
}

/** Daftar tag WordPress. */
async function wpTag(): Promise<Map<number, { id: number; name: string; slug: string }>> {
  return wpCached('tag', TTL_TAKSONOMI, async () => {
    const list = await wpFetch<{ id: number; name: string; slug: string }[]>('/tags?per_page=100&_fields=id,name,slug')
    return new Map(list.map((t) => [t.id, t]))
  })
}

/** Daftar artikel WordPress (ringkas — tanpa isi, supaya cepat). */
export async function wpAmbilDaftar(): Promise<WpPostRingkas[]> {
  return wpCached('daftar', TTL_DAFTAR, async () => {
    const [kategori, tag, posts] = await Promise.all([
      wpKategori(),
      wpTag(),
      wpFetch<WpPostApi[]>(
        '/posts?per_page=100&status=publish&_embed=wp:featuredmedia&_fields=id,slug,date,title,excerpt,featured_media,categories,tags,_embedded',
      ),
    ])
    return posts.map((p) => petakan(p, kategori, tag))
  })
}

/** Satu artikel WordPress lengkap (beserta isi HTML-nya). */
export async function wpAmbilPost(id: number): Promise<WpPostLengkap> {
  return wpCached(`post-${id}`, TTL_POST, async () => {
    const [kategori, tag, post] = await Promise.all([
      wpKategori(),
      wpTag(),
      wpFetch<WpPostApi>(
        `/posts/${id}?_embed=wp:featuredmedia&_fields=id,slug,date,title,excerpt,content,featured_media,categories,tags,_embedded`,
      ),
    ])
    const ringkas = petakan(post, kategori, tag)
    return { ...ringkas, kontenHtml: post.content?.rendered ?? '', coverUrl: coverOf(post) }
  })
}

/**
 * Bersihkan HTML WordPress untuk artikel yang diimpor.
 *
 * Profil lebih longgar daripada `sanitizeKonten` (dipakai untuk konten yang
 * diketik admin): ikut mengizinkan tabel, figure, dan embed YouTube — banyak
 * artikel syathiby.id memuat tabel hasil tes dan video. Embed dibatasi hanya
 * ke youtube.com / youtu.be supaya tidak jadi vektor iframe bebas.
 */
export function sanitizeKontenImpor(html: string) {
  return sanitize(html, {
    allowedTags: [
      'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
      'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img',
      'figure', 'figcaption', 'span', 'iframe',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      h2: ['id'],
      h3: ['id'],
      span: [],
      iframe: ['src', 'title', 'width', 'height', 'allowfullscreen'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      figure: ['class'],
      figcaption: [],
      table: ['class'],
      thead: [], tbody: [], tr: [], p: [], div: [],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: {
      img: ['https', 'http'],
      iframe: ['https'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'youtu.be', 'www.youtube-nocookie.com'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitize.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  })
}

/** Unduh gambar WordPress ke folder upload artikel (sampul & gambar isi). */
export async function unduhGambarWp(url: string, namaDasar: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return null
    const tipe = res.headers.get('content-type') ?? ''
    if (!tipe.startsWith('image/')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > 4 * 1024 * 1024) return null
    const ext = (tipe.split('/')[1] ?? 'jpg').split(';')[0].replace('jpeg', 'jpg').toLowerCase()
    const nama = `${namaDasar.replace(/[^a-z0-9-]/gi, '-').slice(0, 60)}.${ext}`
    const rel = path.posix.join('berita', 'posts', nama)
    const abs = path.join(UPLOAD_BASE, 'berita', 'posts', nama)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, buffer)
    return rel
  } catch {
    return null
  }
}
