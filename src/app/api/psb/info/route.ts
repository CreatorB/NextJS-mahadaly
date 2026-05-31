import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
    if (!info) return Response.json(fail('Data PSB tidak ditemukan'), { status: 404 })
    return Response.json(ok(info))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
