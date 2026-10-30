import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'
import { ambilPegawaiDariUserId } from '@/lib/pegawai'
import { dalamRadius } from '@/lib/geo'
import {
  METODE_GPS,
  METODE_WIFI,
  ambilPengaturanAbsensi,
  ipDiizinkan,
  statusByJamMasuk,
  tanggalHariIniWib,
} from '@/lib/absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface BodyAbsen {
  metode?: string
  latitude?: number
  longitude?: number
  ip?: string
}

/**
 * POST /api/absen
 * Absen masuk (belum ada jam masuk hari ini) atau absen pulang.
 * Metode validasi: 'gps' (jarak ke titik ma'had) atau 'wifi' (IP publik).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid. Silakan login kembali.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) {
      return Response.json(fail('Akun ini tidak terdaftar sebagai pegawai.'), { status: 403 })
    }
    if (!pegawai.isActive) {
      return Response.json(fail('Akun Anda berstatus tidak aktif. Hubungi admin.'), { status: 403 })
    }

    const body = (await req.json().catch(() => ({}))) as BodyAbsen
    const metode = body.metode === METODE_WIFI ? METODE_WIFI : METODE_GPS
    const pengaturan = await ambilPengaturanAbsensi()
    const now = new Date()
    const tanggal = tanggalHariIniWib(now)

    // Validasi lokasi / jaringan.
    let latitude: number | null = null
    let longitude: number | null = null
    let jarak: number | null = null
    let ip: string | null = null

    if (metode === METODE_GPS) {
      const lat = Number(body.latitude)
      const lon = Number(body.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json(fail('Lokasi GPS tidak terbaca. Aktifkan GPS lalu coba lagi.'), { status: 400 })
      }
      const hasil = dalamRadius(lat, lon, pengaturan.latitude, pengaturan.longitude, pengaturan.radiusMeter)
      if (!hasil.valid) {
        return Response.json(
          fail(
            `Anda berada di luar area ma'had (jarak ${hasil.jarak} meter, maksimal ${pengaturan.radiusMeter} meter). Absen hanya bisa dilakukan di dalam area ma'had.`,
          ),
          { status: 400 },
        )
      }
      latitude = lat
      longitude = lon
      jarak = hasil.jarak
    } else {
      ip = body.ip?.trim() || null
      if (!ipDiizinkan(ip, pengaturan)) {
        return Response.json(
          fail("Wi-Fi ini bukan Wi-Fi ma'had. Hubungkan ke Wi-Fi ma'had lalu absen kembali."),
          { status: 400 },
        )
      }
    }

    const existing = await prisma.absensiKerja.findUnique({
      where: { pegawaiId_tanggal: { pegawaiId: pegawai.id, tanggal } },
    })

    if (!existing) {
      const dibuat = await prisma.absensiKerja.create({
        data: {
          pegawaiId: pegawai.id,
          tanggal,
          jamMasuk: now,
          metode,
          latitude,
          longitude,
          jarakMeter: jarak,
          ip,
          status: statusByJamMasuk(now, pengaturan),
        },
      })
      return Response.json(ok(dibuat, 'Absen masuk berhasil dicatat.'))
    }

    if (existing.jamMasuk && !existing.jamPulang) {
      // Data absen masuk (metode/lokasi) tetap dipertahankan; yang diisi hanya jam pulang.
      const diupdate = await prisma.absensiKerja.update({
        where: { id: existing.id },
        data: { jamPulang: now },
      })
      return Response.json(ok(diupdate, 'Absen pulang berhasil dicatat.'))
    }

    return Response.json(fail('Absen hari ini sudah lengkap (masuk dan pulang).'), { status: 400 })
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan absen.'), { status: 500 })
  }
}

/** GET /api/absen — riwayat absen milik pegawai yang sedang login. */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    const hariIni = tanggalHariIniWib()
    const dari = new Date(hariIni.getTime() - 30 * 86400000)
    const pengaturan = await ambilPengaturanAbsensi()

    const rows = await prisma.absensiKerja.findMany({
      where: { pegawaiId: pegawai.id, tanggal: { gte: dari, lte: hariIni } },
      orderBy: { tanggal: 'desc' },
    })

    return Response.json(
      ok({
        pegawai: {
          id: pegawai.id,
          nama: pegawai.nama,
          jabatan: pegawai.jabatan,
          noHp: pegawai.noHp,
          email: pegawai.email,
        },
        pengaturan: {
          jamMasuk: pengaturan.jamMasuk,
          jamPulang: pengaturan.jamPulang,
          toleransiMenit: pengaturan.toleransiMenit,
          radiusMeter: pengaturan.radiusMeter,
        },
        absensi: rows.map((r) => ({
          id: r.id,
          tanggal: r.tanggal.toISOString().slice(0, 10),
          jamMasuk: r.jamMasuk ? r.jamMasuk.toISOString() : null,
          jamPulang: r.jamPulang ? r.jamPulang.toISOString() : null,
          metode: r.metode,
          jarakMeter: r.jarakMeter,
          status: r.status,
          keterangan: r.keterangan,
        })),
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan.'), { status: 500 })
  }
}
