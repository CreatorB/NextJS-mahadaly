/**
 * Lapisan data sisi server untuk management posting blog.
 *
 * Semua query daftar berita, facet (jumlah per kategori/status/tag), dan
 * artikel publik lewat ke sini — supaya panel admin, arsip publik, sitemap,
 * dan RSS memakai sumber data yang sama.
 */

import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { slugify } from '@/lib/slug'
import { computeSeoScore, type SeoCheck } from '@/lib/seo-score'
import { uploadUrl, toPlainText } from '@/lib/berita'
import { APP_BASE_URL } from '@/lib/berita-seo'

export interface BeritaListQuery {
  q?: string
  status?: string
  kategori?: string
  tag?: string
  dari?: string
  sampai?: string
  urutkan?: string
  arah?: string
  halaman?: string
  per?: string
}

export type StatusFilter = 'draft' | 'published' | 'scheduled'

const STATUS_VALID: StatusFilter[] = ['draft', 'published', 'scheduled']

export function parseStatusList(raw: string | undefined): StatusFilter[] {
  if (!raw || raw === 'all') return []
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase() as StatusFilter)
    .filter((s) => STATUS_VALID.includes(s))
}

export function parseListParam(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function parsePage(raw: string | undefined, per: number) {
  const page = Math.max(1, parseInt(raw ?? '1', 10) || 1)
  return { page, per, skip: (page - 1) * per }
}

export function buildBeritaWhere(q: BeritaListQuery, now = new Date()): Prisma.PostWhereInput {
  // Semua filter digabung di dalam AND supaya pencarian teks dan rentang
  // tanggal tidak saling menimpa (keduanya harus berlaku bersamaan).
  const and: Prisma.PostWhereInput[] = []

  const cari = (q.q ?? '').trim()
  if (cari) {
    and.push({
      OR: [
        { judul: { contains: cari } },
        { slug: { contains: cari } },
        { ringkasan: { contains: cari } },
        { konten: { contains: cari } },
      ],
    })
  }

  const status = parseStatusList(q.status)
  if (status.length) {
    const or: Prisma.PostWhereInput[] = []
    if (status.includes('draft')) or.push({ status: 'draft' })
    if (status.includes('published')) or.push({ status: 'published', publishedAt: { lte: now } })
    if (status.includes('scheduled')) or.push({ status: 'published', publishedAt: { gt: now } })
    if (or.length) and.push({ OR: or })
  }

  const kategori = parseListParam(q.kategori)
  if (kategori.length) and.push({ kategori: { slug: { in: kategori } } })

  const tag = parseListParam(q.tag)
  if (tag.length) and.push({ tags: { some: { tag: { slug: { in: tag } } } } })

  // Rentang tanggal dihitung terhadap tanggal terbit.
  const dari = q.dari ? new Date(`${q.dari}T00:00:00`) : null
  const sampai = q.sampai ? new Date(`${q.sampai}T23:59:59`) : null
  if (dari) and.push({ publishedAt: { gte: dari } })
  if (sampai) and.push({ publishedAt: { lte: sampai } })

  return and.length ? { AND: and } : {}
}

export function buildBeritaOrderBy(q: BeritaListQuery): Prisma.PostOrderByWithRelationInput[] {
  const arah = q.arah === 'asc' ? 'asc' : 'desc'
  switch (q.urutkan) {
    case 'terlama':
      return [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
    case 'judul':
      return [{ judul: arah }]
    case 'views':
      return [{ views: arah }]
    case 'diperbarui':
      return [{ updatedAt: arah }]
    case 'seo':
      return [{ updatedAt: 'desc' }]
    default:
      return [{ sticky: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }]
  }
}

export interface BeritaListRow {
  id: number
  judul: string
  slug: string
  status: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  coverImage: string | null
  coverUrl: string | null
  coverAlt: string | null
  kategori: { id: number; slug: string; nama: string; tampil: boolean }
  author: { id: number; nama: string } | null
  tags: { id: number; slug: string; nama: string }[]
  views: number
  sticky: boolean
  noindex: boolean
  nofollow: boolean
  wordCount: number
  readingMinutes: number
  excerpt: string
  seo: { score: number; grade: 'good' | 'ok' | 'bad'; checks: Pick<SeoCheck, 'id' | 'label' | 'status'>[] }
}

const POST_INCLUDE = {
  kategori: { select: { id: true, slug: true, nama: true, tampil: true } },
  author: { select: { id: true, nama: true } },
  tags: { include: { tag: { select: { id: true, slug: true, nama: true } } } },
} satisfies Prisma.PostInclude

type PostWithRel = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>

function toRow(p: PostWithRel): BeritaListRow {
  const tags = p.tags.map((t) => t.tag)
  const seo = computeSeoScore({
    judul: p.judul,
    ringkasan: p.ringkasan,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    focusKeyword: p.focusKeyword,
    slug: p.slug,
    konten: p.konten,
    coverAlt: p.coverAlt,
    baseHost: APP_BASE_URL.replace(/^https?:\/\//, ''),
  })
  return {
    id: p.id,
    judul: p.judul,
    slug: p.slug,
    status: p.status,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    coverImage: p.coverImage,
    coverUrl: uploadUrl(p.coverImage),
    coverAlt: p.coverAlt,
    kategori: p.kategori,
    author: p.author,
    tags,
    views: p.views,
    sticky: p.sticky,
    noindex: p.noindex,
    nofollow: p.nofollow,
    wordCount: seo.words,
    readingMinutes: seo.readingMinutes,
    excerpt: p.ringkasan?.trim() || toPlainText(p.konten).slice(0, 200),
    seo: {
      score: seo.score,
      grade: seo.grade,
      checks: seo.checks.map((c) => ({ id: c.id, label: c.label, status: c.status })),
    },
  }
}

export async function listBerita(q: BeritaListQuery) {
  const per = Math.min(200, Math.max(5, parseInt(q.per ?? '20', 10) || 20))
  const { page, skip } = parsePage(q.halaman, per)
  const where = buildBeritaWhere(q)
  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: buildBeritaOrderBy(q),
      skip,
      take: per,
      include: POST_INCLUDE,
    }),
  ])
  return {
    rows: posts.map(toRow),
    total,
    page,
    perPage: per,
    totalPages: Math.max(1, Math.ceil(total / per)),
  }
}

export interface BeritaFacets {
  kategori: { id: number; slug: string; nama: string; tampil: boolean; count: number }[]
  tag: { id: number; slug: string; nama: string; count: number }[]
  status: { draft: number; published: number; scheduled: number }
  seoRendah: number
}

/** Jumlah isi untuk kartu ringkasan & filter (dihitung tanpa filter status). */
export async function getBeritaFacets(): Promise< BeritaFacets> {
  const now = new Date()
  const [kategori, tag, draft, published, scheduled, perluSeo] = await Promise.all([
    prisma.postKategori.findMany({
      orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { posts: true } } },
    }),
    prisma.postTag.findMany({
      orderBy: { nama: 'asc' },
      include: { _count: { select: { posts: true } } },
    }),
    prisma.post.count({ where: { status: 'draft' } }),
    prisma.post.count({ where: { status: 'published', publishedAt: { lte: now } } }),
    prisma.post.count({ where: { status: 'published', publishedAt: { gt: now } } }),
    // "Perlu SEO" = artikel terbit yang meta SEO-nya belum lengkap diisi.
    // Dihitung di level SQL supaya tidak menarik seluruh isi artikel ke memori.
    prisma.post.count({
      where: {
        status: 'published',
        publishedAt: { lte: now },
        OR: [
          { focusKeyword: null },
          { metaTitle: null },
          { metaDescription: null },
          { ringkasan: null },
        ],
      },
    }),
  ])

  return {
    kategori: kategori.map((k) => ({ id: k.id, slug: k.slug, nama: k.nama, tampil: k.tampil, count: k._count.posts })),
    tag: tag.map((t) => ({ id: t.id, slug: t.slug, nama: t.nama, count: t._count.posts })),
    status: { draft, published, scheduled },
    seoRendah: perluSeo,
  }
}

/** Slug unik untuk kategori / tag (tabel berbeda dari artikel). */
export async function uniqueTaxonomySlug(
  table: 'kategori' | 'tag',
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = slugify(base, { maxLength: 80, fallback: table === 'kategori' ? 'kategori' : 'tag' })
  let slug = root
  for (let i = 2; ; i++) {
    const found =
      table === 'kategori'
        ? await prisma.postKategori.findUnique({ where: { slug }, select: { id: true } })
        : await prisma.postTag.findUnique({ where: { slug }, select: { id: true } })
    if (!found || found.id === excludeId) return slug
    slug = `${root}-${i}`
  }
}

/** Ambil tag berdasarkan daftar slug; buat yang belum ada. */
export async function upsertTagsBySlug(slugs: string[]) {
  const hasil: { id: number; slug: string; nama: string }[] = []
  for (const raw of slugs) {
    const nama = raw.trim()
    if (!nama) continue
    const slug = slugify(nama, { maxLength: 80, fallback: 'tag' })
    const ada = await prisma.postTag.findUnique({ where: { slug } })
    const tag = ada ?? (await prisma.postTag.create({ data: { slug, nama } }))
    hasil.push({ id: tag.id, slug: tag.slug, nama: tag.nama })
  }
  return hasil
}

/** Ganti seluruh tag sebuah artikel dengan daftar slug yang diberikan. */
export async function setPostTags(postId: number, slugs: string[]) {
  const tags = await upsertTagsBySlug(slugs)
  await prisma.postTagOnPost.deleteMany({ where: { postId } })
  if (tags.length) {
    await prisma.postTagOnPost.createMany({ data: tags.map((t) => ({ postId, tagId: t.id })) })
  }
  return tags
}

/** Simpan snapshot isi post saat ini ke riwayat revisi (maks 30 per artikel). */
export async function snapshotRevision(postId: number, userId: number | null, note?: string) {
  const p = await prisma.post.findUnique({ where: { id: postId } })
  if (!p) return null
  const rev = await prisma.postRevision.create({
    data: {
      postId,
      judul: p.judul,
      slug: p.slug,
      ringkasan: p.ringkasan,
      konten: p.konten,
      coverImage: p.coverImage,
      status: p.status,
      kategoriId: p.kategoriId,
      note: note ?? null,
      createdById: userId,
    },
  })
  const lama = await prisma.postRevision.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    skip: 30,
    select: { id: true },
  })
  if (lama.length) {
    await prisma.postRevision.deleteMany({ where: { id: { in: lama.map((r) => r.id) } } })
  }
  return rev
}
