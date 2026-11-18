import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { slugify, isReservedSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/berita/slug-check?slug=...&id=...
 * Cek ketersediaan slug artikel (dipakai pratinjau URL di panel admin).
 */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const mentah = (sp.get('slug') ?? '').trim()
  const id = sp.get('id') ? Number(sp.get('id')) : undefined

  if (!mentah) return Response.json(ok({ available: true, suggestion: '' }))
  if (!/^[a-z0-9-]*$/.test(mentah)) {
    return Response.json(ok({ available: false, suggestion: slugify(mentah), alasan: 'Slug hanya huruf kecil, angka, dan tanda -' }))
  }
  if (isReservedSlug(mentah)) {
    return Response.json(ok({ available: false, suggestion: `${mentah}-artikel`, alasan: 'Slug itu dipakai halaman lain' }))
  }

  const exist = await prisma.post.findUnique({ where: { slug: mentah }, select: { id: true } })
  if (exist && exist.id !== id) {
    let saran = mentah
    for (let i = 2; ; i++) {
      const cek = await prisma.post.findUnique({ where: { slug: `${mentah}-${i}` }, select: { id: true } })
      if (!cek) {
        saran = `${mentah}-${i}`
        break
      }
    }
    return Response.json(ok({ available: false, suggestion: saran, alasan: 'URL sudah dipakai berita lain' }))
  }

  return Response.json(ok({ available: true, suggestion: mentah }))
}
