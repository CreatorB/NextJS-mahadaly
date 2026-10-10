import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const onlyActive = searchParams.get('active') !== 'false'

    const where: { isActive?: boolean; slug?: string } = {}
    if (onlyActive) where.isActive = true
    if (slug) where.slug = slug

    const cards = await prisma.crossAppCardSetting.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    })

    return Response.json(ok(cards))
  } catch (e) {
    console.error('[cross-cards GET]', e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
