import { ambilPengaturanAbsensi } from '@/lib/absensi'
import { PengaturanClient } from './PengaturanClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pengaturan Absen Kerja — Admin' }

export default async function AdminPengaturanAbsensiPage() {
  const pengaturan = await ambilPengaturanAbsensi()

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
      }}
    />
  )
}
