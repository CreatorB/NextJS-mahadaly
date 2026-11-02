import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { SEMUA_STATUS, STATUS_ADMIN } from '@/lib/absensi'
import { catatRiwayat } from '@/lib/riwayat'
import { buatCatatanAbsensi, parseTanggalWib } from '@/lib/pengajuan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Aksi = 'set-status' | 'hapus' | 'buat-catatan'

interface Body {
  ids?: number[]
  aksi?: Aksi
  status?: string
  keterangan?: string
  /** Untuk aksi 'buat-catatan'. */
  pegawaiId?: number
  tanggal?: string
}

const LABEL_STATUS: Record<string, string> = {
  hadir: 'Hadir',
  telat: 'Telat',
  izin: 'Izin',
  sakit: 'Sakit',
  cuti: 'Cuti',
  alpa: 'Alpa',
}

/**
 * POST /api/admin/absen/bulk
 * Aksi massal untuk baris absensi terpilih (koreksi status / hapus) plus
 * pembuatan catatan manual untuk hari yang belum ada catatan.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi(req)
  if (!session) return Response.json(fail('Akses ditolak'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Body
  const aksi = body.aksi

  // --- Buat catatan manual (mis. sakit / izin untuk hari tanpa absen) ---
  if (aksi === 'buat-catatan') {
    const pegawaiId = Number(body.pegawaiId)
    const tanggal = parseTanggalWib(body.tanggal)
    const status = String(body.status ?? '')
    const keterangan = String(body.keterangan ?? '').trim() || null

    if (!Number.isFinite(pegawaiId)) {
      return Response.json(fail('Pilih pegawai.'), { status: 400 })
    }
    if (!tanggal) {
      return Response.json(fail('Tanggal tidak valid.'), { status: 400 })
    }
    if (!STATUS_ADMIN.includes(status as (typeof STATUS_ADMIN)[number])) {
      return Response.json(fail('Status tidak dikenal.'), { status: 400 })
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
      select: { id: true, nama: true },
    })
    if (!pegawai) return Response.json(fail('Data pegawai tidak ditemukan.'), { status: 404 })

    const hasil = await buatCatatanAbsensi({
      pegawaiId,
      tanggal,
      status,
      keterangan,
      sumber: 'manual',
    })

    await catatRiwayat({
      aksi: 'buat-catatan',
      entitas: 'absensi',
      entitasId: hasil.id,
      pegawaiId,
      sesudah: { status, tanggal: tanggal.toISOString().slice(0, 10), keterangan },
      keterangan: `Catatan manual: ${LABEL_STATUS[status] ?? status} untuk ${pegawai.nama}`,
      actorId: session.userId,
      actorNama: session.nama,
    })

    return Response.json(
      ok(
        { id: hasil.id, dibuat: hasil.dibuat },
        hasil.dibuat
          ? `Catatan ${LABEL_STATUS[status] ?? status} dibuat untuk ${pegawai.nama}.`
          : `Catatan ${LABEL_STATUS[status] ?? status} diperbarui untuk ${pegawai.nama}.`,
      ),
    )
  }

  const ids = Array.isArray(body.ids) ? body.ids.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : []

  if (ids.length === 0) {
    return Response.json(fail('Pilih minimal satu baris.'), { status: 400 })
  }

  if (aksi === 'set-status') {
    const status = String(body.status ?? '')
    if (!SEMUA_STATUS.includes(status as (typeof SEMUA_STATUS)[number])) {
      return Response.json(fail('Status tidak dikenal.'), { status: 400 })
    }
    const keterangan = String(body.keterangan ?? '').trim().slice(0, 255) || null

    const sebelum = await prisma.absensiKerja.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, keterangan: true, pegawaiId: true },
    })
    const hasil = await prisma.absensiKerja.updateMany({
      where: { id: { in: ids } },
      data: { status, keterangan, sumber: 'manual' },
    })

    for (const s of sebelum) {
      await catatRiwayat({
        aksi: 'set-status',
        entitas: 'absensi',
        entitasId: s.id,
        pegawaiId: s.pegawaiId,
        sebelum: { status: s.status, keterangan: s.keterangan },
        sesudah: { status, keterangan },
        keterangan: `Status diubah menjadi ${LABEL_STATUS[status] ?? status}`,
        actorId: session.userId,
        actorNama: session.nama,
      })
    }

    return Response.json(
      ok({ affect: hasil.count }, `${hasil.count} baris absensi diubah menjadi "${LABEL_STATUS[status] ?? status}".`),
    )
  }

  if (aksi === 'hapus') {
    const sebelum = await prisma.absensiKerja.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, pegawaiId: true, tanggal: true },
    })
    const hasil = await prisma.absensiKerja.deleteMany({ where: { id: { in: ids } } })

    for (const s of sebelum) {
      await catatRiwayat({
        aksi: 'hapus',
        entitas: 'absensi',
        entitasId: s.id,
        pegawaiId: s.pegawaiId,
        sebelum: { status: s.status, tanggal: s.tanggal.toISOString().slice(0, 10) },
        sesudah: null,
        keterangan: 'Baris absensi dihapus admin',
        actorId: session.userId,
        actorNama: session.nama,
      })
    }

    return Response.json(ok({ affect: hasil.count }, `${hasil.count} baris absensi dihapus.`))
  }

  return Response.json(fail('Aksi tidak dikenal.'), { status: 400 })
}
