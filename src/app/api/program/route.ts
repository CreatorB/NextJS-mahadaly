import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      where: { statusPsb: 'Buka' },
      orderBy: { id: 'asc' },
    })
    return Response.json(ok(programs))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
