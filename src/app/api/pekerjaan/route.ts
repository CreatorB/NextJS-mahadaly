import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'

export async function GET() {
  try {
    const pekerjaans = await prisma.pekerjaan.findMany({ orderBy: { id: 'asc' } })
    return Response.json(ok(pekerjaans))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
