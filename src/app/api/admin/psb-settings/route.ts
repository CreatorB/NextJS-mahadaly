import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  return Response.json(ok(info))
}

export async function PUT(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })
  const body = await req.json()
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  if (!info) return Response.json(fail('Data tidak ditemukan'), { status: 404 })
  const updated = await prisma.infoPsb.update({
    where: { id: info.id },
    data: {
      statusPsb: body.statusPsb ?? info.statusPsb,
      datetimeOpen: body.datetimeOpen ? new Date(body.datetimeOpen) : info.datetimeOpen,
      datetimeClosed: body.datetimeClosed ? new Date(body.datetimeClosed) : info.datetimeClosed,
      quotaIkhwan: body.quotaIkhwan != null ? parseInt(body.quotaIkhwan) : info.quotaIkhwan,
      quotaAkhwat: body.quotaAkhwat != null ? parseInt(body.quotaAkhwat) : info.quotaAkhwat,
      biayaPendaftaran: body.biayaPendaftaran != null && body.biayaPendaftaran !== '' ? parseInt(body.biayaPendaftaran) : info.biayaPendaftaran,
      biayaPangkal: body.biayaPangkal != null && body.biayaPangkal !== '' ? parseInt(body.biayaPangkal) : info.biayaPangkal,
      biayaKuliahSemester: body.biayaKuliahSemester != null && body.biayaKuliahSemester !== '' ? parseInt(body.biayaKuliahSemester) : info.biayaKuliahSemester,
      biayaCicilanBulanan: body.biayaCicilanBulanan != null && body.biayaCicilanBulanan !== '' ? parseInt(body.biayaCicilanBulanan) : info.biayaCicilanBulanan,
      linkGroup: body.linkGroup !== undefined ? body.linkGroup : info.linkGroup,
      kontenPsb: body.kontenPsb ?? info.kontenPsb,
      posterImages: body.linkPoster !== undefined ? body.linkPoster : info.posterImages,
    },
  })
  return Response.json(ok(updated))
}
