import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const provinsiId = searchParams.get('provinsiId')
  if (!provinsiId) return NextResponse.json([], { status: 400 })
  const kabupaten = await prisma.kabupatenKota.findMany({
    where: { provinsiId: parseInt(provinsiId) },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(kabupaten)
}