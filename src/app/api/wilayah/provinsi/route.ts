import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const provinsi = await prisma.provinsi.findMany({
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(provinsi)
}