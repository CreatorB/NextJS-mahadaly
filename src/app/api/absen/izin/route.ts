import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'
import { ambilPegawaiDariUserId } from '@/lib/pegawai'
import { STATUS_IZIN, tanggalHariIniWib } from '@/lib/absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/absen/izin
 * Pegawai mengajukan izin (tidak masuk kerja) untuk hari ini.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    const body = (await req.json().catch(() => ({}))) as { keterangan?: string }
    const keterangan = (body.keterangan ?? '').trim()
    if (keterangan.length < 3) {
      return Response.json(fail('Tuliskan alasan izin (minimal 3 karakter).'), { status: 400 })
    }
    if (keterangan.length > 240) {
      return Response.json(fail('Alasan izin terlalu panjang (maksimal 240 karakter).'), { status: 400 })
    }

    const tanggal = tanggalHariIniWib()
    const existing = await prisma.absensiKerja.findUnique({
      where: { pegawaiId_tanggal: { pegawaiId: pegawai.id, tanggal } },
    })

    if (existing?.jamMasuk) {
      return Response.json(fail('Anda sudah absen masuk hari ini, izin tidak bisa diajukan.'), { status: 400 })
    }

    const data = await prisma.absensiKerja.upsert({
      where: { pegawaiId_tanggal: { pegawaiId: pegawai.id, tanggal } },
      create: {
        pegawaiId: pegawai.id,
        tanggal,
        status: STATUS_IZIN,
        keterangan,
      },
      update: { status: STATUS_IZIN, keterangan },
    })

    return Response.json(ok(data, 'Pengajuan izin terkirim.'))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat mengirim izin.'), { status: 500 })
  }
}
