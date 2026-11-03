import prisma from '@/lib/prisma'
import { ambilPengaturanAbsensi } from '@/lib/absensi'
import { PengaturanClient } from './PengaturanClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pengaturan Absen Kerja — Admin' }

export default async function AdminPengaturanAbsensiPage() {
  const pengaturan = await ambilPengaturanAbsensi()

  const [shift, hariLibur, pegawai, jadwal] = await Promise.all([
    prisma.shift.findMany({ orderBy: { nama: 'asc' } }),
    prisma.hariLibur.findMany({ orderBy: { tanggal: 'asc' }, take: 120 }),
    prisma.pegawai.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true },
    }),
    prisma.jadwalShift.findMany(),
  ])

  return (
    <PengaturanClient
      awal={{
        jamMasuk: pengaturan.jamMasuk,
        jamPulang: pengaturan.jamPulang,
        toleransiMenit: pengaturan.toleransiMenit,
        latitude: pengaturan.latitude,
        longitude: pengaturan.longitude,
        radiusMeter: pengaturan.radiusMeter,
        wifiIps: pengaturan.wifiIps,
        hariKerja: pengaturan.hariKerja,
        batasTelatMenit: pengaturan.batasTelatMenit,
        batasAlpaHari: pengaturan.batasAlpaHari,
        autoSimpanAlpa: pengaturan.autoSimpanAlpa,
        defaultShiftId: pengaturan.defaultShiftId,
      }}
      shift={shift.map((s) => ({
        id: s.id,
        nama: s.nama,
        jamMasuk: s.jamMasuk,
        jamPulang: s.jamPulang,
        toleransiMenit: s.toleransiMenit,
        jamIstirahatMulai: s.jamIstirahatMulai,
        jamIstirahatSelesai: s.jamIstirahatSelesai,
      }))}
      hariLibur={hariLibur.map((h) => ({
        id: h.id,
        tanggal: h.tanggal.toISOString().slice(0, 10),
        nama: h.nama,
        jenis: h.jenis,
      }))}
      pegawai={pegawai.map((p) => ({ id: p.id, nama: p.nama }))}
      jadwal={jadwal.map((j) => ({ pegawaiId: j.pegawaiId, hari: j.hari, shiftId: j.shiftId }))}
    />
  )
}
