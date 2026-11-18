import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { bulkPostSchema } from '@/lib/validations/berita'
import { upsertTagsBySlug } from '@/lib/berita-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/berita/bulk — aksi massal untuk berita terpilih.
 */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = bulkPostSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return Response.json(fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>), { status: 422 })
  }
  const { ids } = parsed.data
  const data = parsed.data as {
    ids: number[]
    aksi: string
    publishedAt?: string
    kategoriId?: number
    tagSlug?: string
  }

  const found = await prisma.post.findMany({ where: { id: { in: ids } }, select: { id: true } })
  if (found.length === 0) return Response.json(fail('Data berita tidak ditemukan.'), { status: 404 })

  let affect = 0
  let pesan = ''

  switch (data.aksi) {
    case 'publish': {
      const hasil = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status: 'published', publishedAt: new Date(), updatedById: session.userId },
      })
      affect = hasil.count
      pesan = 'diterbitkan'
      break
    }
    case 'draft': {
      const hasil = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status: 'draft', updatedById: session.userId },
      })
      affect = hasil.count
      pesan = 'dijadikan draft'
      break
    }
    case 'schedule': {
      if (!data.publishedAt) return Response.json(fail('Tanggal tayang wajib diisi.'), { status: 400 })
      const hasil = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status: 'published', publishedAt: new Date(data.publishedAt), updatedById: session.userId },
      })
      affect = hasil.count
      pesan = 'dijadwalkan'
      break
    }
    case 'kategori': {
      if (!data.kategoriId) return Response.json(fail('Kategori tujuan wajib dipilih.'), { status: 400 })
      const hasil = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { kategoriId: data.kategoriId, updatedById: session.userId },
      })
      affect = hasil.count
      pesan = 'dipindahkan kategorinya'
      break
    }
    case 'tag': {
      if (!data.tagSlug) return Response.json(fail('Tag wajib diisi.'), { status: 400 })
      const [tag] = await upsertTagsBySlug([data.tagSlug])
      for (const id of ids) {
        await prisma.postTagOnPost.upsert({
          where: { postId_tagId: { postId: id, tagId: tag.id } },
          create: { postId: id, tagId: tag.id },
          update: {},
        })
      }
      affect = ids.length
      pesan = `ditandai tag "${tag.nama}"`
      break
    }
    case 'sticky': {
      const hasil = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { sticky: true, updatedById: session.userId },
      })
      affect = hasil.count
      pesan = 'disematkan'
      break
    }
    case 'unsticky': {
      const hasil = await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { sticky: false, updatedById: session.userId },
      })
      affect = hasil.count
      pesan = 'dilepas sematan'
      break
    }
    case 'hapus': {
      const hasil = await prisma.post.deleteMany({ where: { id: { in: ids } } })
      affect = hasil.count
      pesan = 'dihapus'
      break
    }
    default:
      return Response.json(fail('Aksi tidak dikenal.'), { status: 400 })
  }

  return Response.json(ok({ affect }, `${affect} berita berhasil ${pesan}.`))
}
