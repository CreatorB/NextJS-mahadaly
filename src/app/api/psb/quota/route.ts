import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
    if (!info) return Response.json(fail('Data PSB tidak ditemukan'), { status: 404 })

    const [ikhwan, akhwat] = await Promise.all([
      prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Laki-Laki' } }),
      prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Perempuan' } }),
    ])

    return Response.json(ok({
      tahunAjaran: info.tahunAjaran,
      quotaIkhwan: info.quotaIkhwan,
      quotaAkhwat: info.quotaAkhwat,
      terdaftarIkhwan: ikhwan,
      terdaftarAkhwat: akhwat,
      sisaIkhwan: info.quotaIkhwan != null ? Math.max(0, info.quotaIkhwan - ikhwan) : null,
      sisaAkhwat: info.quotaAkhwat != null ? Math.max(0, info.quotaAkhwat - akhwat) : null,
    }))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
