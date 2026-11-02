import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'
import { ambilPegawaiDariUserId } from '@/lib/pegawai'
import {
  JENIS_PENGAJUAN,
  LABEL_JENIS,
  parseTanggalWib,
  rentangTanggal,
} from '@/lib/pengajuan'
import { tanggalHariIniWib } from '@/lib/absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  jenis?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  keterangan?: string
  buktiUrl?: string | null
  id?: number
  aksi?: string
}

/**
 * Pengajuan izin / sakit / cuti oleh staf.
 *
 * GET  -> daftar pengajuan milik staf yang login.
 * POST -> ajukan pengajuan baru (status `menunggu`).
 * PATCH -> batalkan pengajuan yang masih menunggu.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    const daftar = await prisma.pengajuan.findMany({
      where: { pegawaiId: pegawai.id },
      orderBy: { createdAt: 'desc' },
      take: 60,
    })

    return Response.json(
      ok({
        pengajuan: daftar.map((p) => ({
          id: p.id,
          jenis: p.jenis,
          labelJenis: LABEL_JENIS[p.jenis] ?? p.jenis,
          tanggalMulai: p.tanggalMulai.toISOString().slice(0, 10),
          tanggalSelesai: p.tanggalSelesai.toISOString().slice(0, 10),
          keterangan: p.keterangan,
          buktiUrl: p.buktiUrl,
          status: p.status,
          alasanVerifikasi: p.alasanVerifikasi,
          reviewedAt: p.reviewedAt,
          createdAt: p.createdAt,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat memuat pengajuan.'), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    const body = (await req.json().catch(() => ({}))) as Body

    const jenis = String(body.jenis ?? '').trim().toLowerCase()
    if (!JENIS_PENGAJUAN.includes(jenis as (typeof JENIS_PENGAJUAN)[number])) {
      return Response.json(fail('Jenis pengajuan tidak dikenal.'), { status: 400 })
    }

    const keterangan = String(body.keterangan ?? '').trim()
    if (keterangan.length < 3) {
      return Response.json(fail('Tuliskan keterangan (minimal 3 karakter).'), { status: 400 })
    }
    if (keterangan.length > 500) {
      return Response.json(fail('Keterangan terlalu panjang (maksimal 500 karakter).'), { status: 400 })
    }

    const hariIni = tanggalHariIniWib()
    const mulai = parseTanggalWib(body.tanggalMulai) ?? hariIni
    const selesai = parseTanggalWib(body.tanggalSelesai) ?? mulai

    if (mulai.getTime() < hariIni.getTime() - 7 * 86400000) {
      return Response.json(
        fail('Pengajuan paling lama untuk 7 hari ke belakang. Hubungi admin untuk kasus lain.'),
        { status: 400 },
      )
    }
    if (selesai.getTime() < mulai.getTime()) {
      return Response.json(fail('Tanggal selesai tidak boleh sebelum tanggal mulai.'), { status: 400 })
    }
    if (rentangTanggal(mulai, selesai).length > 60) {
      return Response.json(fail('Rentang pengajuan maksimal 60 hari.'), { status: 400 })
    }

    // Cegah pengajuan ganda untuk rentang yang sama.
    const bentrok = await prisma.pengajuan.findFirst({
      where: {
        pegawaiId: pegawai.id,
        status: 'menunggu',
        tanggalMulai: { lte: selesai },
        tanggalSelesai: { gte: mulai },
      },
    })
    if (bentrok) {
      return Response.json(
        fail('Sudah ada pengajuan menunggu untuk rentang tanggal tersebut.'),
        { status: 400 },
      )
    }

    const pengajuan = await prisma.pengajuan.create({
      data: {
        pegawaiId: pegawai.id,
        jenis,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        keterangan,
        buktiUrl: body.buktiUrl?.trim() || null,
        status: 'menunggu',
      },
    })

    return Response.json(
      ok(
        { id: pengajuan.id, status: pengajuan.status },
        `Pengajuan ${LABEL_JENIS[jenis]} terkirim, menunggu persetujuan admin.`,
      ),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat mengirim pengajuan.'), { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    const body = (await req.json().catch(() => ({}))) as Body
    const id = Number(body.id)
    if (!Number.isFinite(id)) return Response.json(fail('Pengajuan tidak ditemukan.'), { status: 404 })

    const pengajuan = await prisma.pengajuan.findFirst({
      where: { id, pegawaiId: pegawai.id },
    })
    if (!pengajuan) return Response.json(fail('Pengajuan tidak ditemukan.'), { status: 404 })
    if (pengajuan.status !== 'menunggu') {
      return Response.json(
        fail('Pengajuan sudah diproses admin dan tidak bisa dibatalkan.'),
        { status: 400 },
      )
    }

    await prisma.pengajuan.update({
      where: { id },
      data: { status: 'dibatalkan' },
    })

    return Response.json(ok({ id }, 'Pengajuan dibatalkan.'))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat membatalkan pengajuan.'), { status: 500 })
  }
}
