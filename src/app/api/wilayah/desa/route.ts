import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const kecamatanId = searchParams.get('kecamatanId')
  if (!kecamatanId) return NextResponse.json([], { status: 400 })
  const desa = await prisma.desa.findMany({
    where: { kecamatanId: parseInt(kecamatanId) },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(desa)
}