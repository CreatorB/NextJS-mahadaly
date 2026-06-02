import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const kabupatenId = searchParams.get('kabupatenId')
  if (!kabupatenId) return NextResponse.json([], { status: 400 })
  const kecamatan = await prisma.kecamatan.findMany({
    where: { kabupatenId: parseInt(kabupatenId) },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(kecamatan)
}