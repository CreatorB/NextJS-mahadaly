import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { uniquePostSlug } from '@/lib/berita'
import { setPostTags } from '@/lib/berita-admin'
import {
  sanitizeKontenImpor, unduhGambarWp, wpAmbilDaftar, wpAmbilPost, WP_BASE_URL,
} from '@/lib/wordpress'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * GET /api/admin/berita/impor
 * Daftar artikel WordPress + penanda mana yang sudah pernah diimpor.
 */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  try {
    const daftar = await wpAmbilDaftar()
    const slugTerpakai = new Set(
      (await prisma.post.findMany({ select: { slug: true } })).map((p) => p.slug),
    )

    return Response.json(
      ok(
        {
          sumber: WP_BASE_URL,
          total: daftar.length,
          posts: daftar.map((p) => ({
            id: p.id,
            slug: p.slug,
            judul: p.judul,
            tanggal: p.tanggal,
            excerpt: p.excerpt.slice(0, 200),
            kategori: p.kategori,
            tag: p.tag,
            coverUrl: p.coverUrl,
            sudahDiimpor: slugTerpakai.has(p.slug),
          })),
        },
        `${daftar.length} artikel WordPress`,
      ),
    )
  } catch (e) {
    return Response.json(
      fail(
        `Gagal mengambil artikel dari WordPress: ${e instanceof Error ? e.message : 'tidak diketahui'}. ` +
          'Pastikan server bisa menjangkau wp-json WordPress.',
      ),
      { status: 502 },
    )
  }
}

interface Body {
  ids?: number[]
  kategoriId?: number
  status?: 'draft' | 'published'
  importTag?: boolean
}

/**
 * POST /api/admin/berita/impor
 * Salin artikel WordPress terpilih menjadi artikel di panel Berita.
 */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Body
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n) => Number.isFinite(n)) : []
  if (!ids.length) return Response.json(fail('Pilih minimal satu artikel WordPress.'), { status: 400 })

  const kategoriId = Number(body.kategoriId)
  if (!Number.isInteger(kategoriId) || kategoriId <= 0) {
    return Response.json(fail('Kategori tujuan wajib dipilih.'), { status: 400 })
  }
  const kategori = await prisma.postKategori.findUnique({ where: { id: kategoriId } })
  if (!kategori) return Response.json(fail('Kategori tujuan tidak ditemukan.'), { status: 404 })

  const status = body.status === 'published' ? 'published' : 'draft'
  const userId = session.userId
  const importTag = body.importTag === true

  const hasil: { judul: string; id?: number; pesan: string }[] = []

  // Ambil artikel WordPress paralel (maksimal 4 sekaligus) — satu permintaan
  // `wp-json` saja bisa 20 detik, jadi serial akan sangat lambat.
  const antre: { judul: string; id?: number; pesan: string }[] = []
  const maksParalel = 4
  let indeks = 0

  async function kerjakan(wpId: number) {
    try {
      const wp = await wpAmbilPost(wpId)
      const slug = await uniquePostSlug(wp.slug || wp.judul)

      // Sampul: unduh dari WordPress supaya situs tidak bergantung pada
      // hotlink ke syathiby.id (yang memakai challenge Cloudflare).
      let coverImage: string | null = null
      let coverAlt: string | null = null
      if (wp.coverUrl) {
        const rel = await unduhGambarWp(wp.coverUrl, `wp-${wpId}-${slug}`)
        if (rel) {
          coverImage = rel
          coverAlt = wp.judul.slice(0, 255)
        }
      }

      const tanggalWp = new Date(wp.tanggal)
      const publishedAt =
        status === 'published'
          ? tanggalWp > new Date()
            ? new Date()
            : tanggalWp
          : null

      const post = await prisma.post.create({
        data: {
          judul: wp.judul.slice(0, 200) || `Impor WP ${wp.id}`,
          slug,
          ringkasan: (wp.excerpt || '').slice(0, 300) || null,
          konten: sanitizeKontenImpor(wp.kontenHtml) || '<p>Impor dari WordPress.</p>',
          coverImage,
          coverAlt,
          status,
          publishedAt,
          kategoriId,
          authorId: userId,
          updatedById: userId,
          focusKeyword: wp.kategori[0]?.name ?? null,
          seoKeywords: importTag ? wp.tag.map((t) => t.name).join(', ').slice(0, 255) || null : null,
          schemaJsonLd: true,
        },
      })

      if (importTag && wp.tag.length) {
        await setPostTags(post.id, wp.tag.map((t) => t.name))
      }

      return { judul: wp.judul, id: post.id, pesan: 'diimpor' }
    } catch (e) {
      return {
        judul: `WP #${wpId}`,
        pesan: `gagal: ${e instanceof Error ? e.message : 'tidak diketahui'}`,
      }
    }
  }

  const pekerja = Array.from({ length: Math.min(maksParalel, ids.length) }, async () => {
    while (indeks < ids.length) {
      const i = indeks++
      antre.push(await kerjakan(ids[i]))
    }
  })
  await Promise.all(pekerja)

  hasil.push(...antre)

  const sukses = hasil.filter((h) => h.id).length
  const gagal = hasil.length - sukses
  return Response.json(
    ok(
      { hasil, sukses, gagal },
      `${sukses} artikel diimpor${gagal ? `, ${gagal} gagal` : ''}`,
    ),
  )
}
