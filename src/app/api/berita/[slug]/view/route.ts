import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/berita/:slug/view — penghitung dilihat.
 * Cookie per artikel mencegah penghitungan berulang dari refresh yang sama.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true, views: true } })
  if (!post) return NextResponse.json(fail('Berita tidak ditemukan'), { status: 404 })

  const namaCookie = `berita_dilihat_${post.id}`
  if (req.cookies.get(namaCookie)) {
    return NextResponse.json(ok({ views: post.views }, 'Sudah dihitung'))
  }

  const hasil = await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
    select: { views: true },
  })

  const res = NextResponse.json(ok({ views: hasil.views }, 'Terhitung'))
  res.cookies.set(namaCookie, '1', {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  })
  return res
}
