import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { ambilPengaturanAbsensi } from '@/lib/absensi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/admin/pengaturan-absensi */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const pengaturan = await ambilPengaturanAbsensi()
  return Response.json(ok(pengaturan))
}

/**
 * PUT /api/admin/pengaturan-absensi
 * Simpan jam kerja, toleransi telat, titik koordinat + radius GPS, dan IP Wi-Fi.
 */
export async function PUT(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const jamMasuk = String(body.jamMasuk ?? '07:00:00')
  const jamPulang = String(body.jamPulang ?? '15:00:00')
  const jamRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
  if (!jamRegex.test(jamMasuk) || !jamRegex.test(jamPulang)) {
    return Response.json(fail('Format jam harus HH:MM (contoh 07:00).'), { status: 400 })
  }

  const toleransiMenit = Number(body.toleransiMenit ?? 5)
  if (!Number.isFinite(toleransiMenit) || toleransiMenit < 0 || toleransiMenit > 120) {
    return Response.json(fail('Toleransi keterlambatan harus antara 0-120 menit.'), { status: 400 })
  }

  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return Response.json(fail('Latitude tidak valid.'), { status: 400 })
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return Response.json(fail('Longitude tidak valid.'), { status: 400 })
  }

  const radiusMeter = Number(body.radiusMeter ?? 200)
  if (!Number.isFinite(radiusMeter) || radiusMeter < 10 || radiusMeter > 5000) {
    return Response.json(fail('Radius GPS harus antara 10-5000 meter.'), { status: 400 })
  }

  const wifiIps = (Array.isArray(body.wifiIps) ? body.wifiIps : String(body.wifiIps ?? '').split(','))
    .map((ip) => String(ip).trim())
    .filter(Boolean)

  if (wifiIps.length === 0) {
    return Response.json(fail('Isi minimal satu IP Wi-Fi ma\'had.'), { status: 400 })
  }

  const row = await prisma.pengaturanAbsensi.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      jamMasuk: jamMasuk.length === 5 ? `${jamMasuk}:00` : jamMasuk,
      jamPulang: jamPulang.length === 5 ? `${jamPulang}:00` : jamPulang,
      toleransiMenit: Math.round(toleransiMenit),
      latitude,
      longitude,
      radiusMeter: Math.round(radiusMeter),
      wifiIps: wifiIps.join(','),
    },
    update: {
      jamMasuk: jamMasuk.length === 5 ? `${jamMasuk}:00` : jamMasuk,
      jamPulang: jamPulang.length === 5 ? `${jamPulang}:00` : jamPulang,
      toleransiMenit: Math.round(toleransiMenit),
      latitude,
      longitude,
      radiusMeter: Math.round(radiusMeter),
      wifiIps: wifiIps.join(','),
    },
  })

  return Response.json(ok(row, 'Pengaturan absensi berhasil disimpan.'))
}
