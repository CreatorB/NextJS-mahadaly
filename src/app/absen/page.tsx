import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ambilPegawaiDariUserId } from '@/lib/pegawai'
import { ambilPengaturanAbsensi, tanggalHariIniWib } from '@/lib/absensi'
import { muatKonteksJadwal, jamKerjaUntuk } from '@/lib/jadwal'
import { AbsenClient, type BarisAbsensi, type PengajuanView } from './AbsenClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Absen Kerja — Ma\'had Aly' }

export default async function AbsenPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/absen')

  const pegawai = await ambilPegawaiDariUserId(session.userId)
  if (!pegawai) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-primary">Akun belum terdaftar sebagai pegawai</h1>
        <p className="mt-2 text-sm text-gray-600">
          Silakan hubungi admin ma&apos;had untuk menautkan akun Anda ke data pegawai.
        </p>
      </div>
    )
  }

  const pengaturan = await ambilPengaturanAbsensi()
  const hariIni = tanggalHariIniWib()
  const dari = new Date(hariIni.getTime() - 30 * 86400000)

  const [rows, daftarPengajuan] = await Promise.all([
    prisma.absensiKerja.findMany({
      where: { pegawaiId: pegawai.id, tanggal: { gte: dari, lte: hariIni } },
      orderBy: { tanggal: 'desc' },
    }),
    prisma.pengajuan.findMany({
      where: { pegawaiId: pegawai.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  // Jam kerja efektif hari ini (manual > shift per hari > shift default > global).
  const konteks = await muatKonteksJadwal(pengaturan, { dari: hariIni, sampai: hariIni })
  const jamKerja = jamKerjaUntuk(konteks, pegawai, hariIni)

  const keBaris = (r: (typeof rows)[number]): BarisAbsensi => ({
    id: r.id,
    tanggal: r.tanggal.toISOString().slice(0, 10),
    jamMasuk: r.jamMasuk ? r.jamMasuk.toISOString() : null,
    jamPulang: r.jamPulang ? r.jamPulang.toISOString() : null,
    metode: r.metode,
    jarakMeter: r.jarakMeter,
    status: r.status,
    keterangan: r.keterangan,
  })

  const kePengajuan = (p: (typeof daftarPengajuan)[number]): PengajuanView => ({
    id: p.id,
    jenis: p.jenis,
    tanggalMulai: p.tanggalMulai.toISOString().slice(0, 10),
    tanggalSelesai: p.tanggalSelesai.toISOString().slice(0, 10),
    keterangan: p.keterangan,
    status: p.status,
    alasanVerifikasi: p.alasanVerifikasi,
  })

  const hariIniRow = rows.find((r) => r.tanggal.getTime() === hariIni.getTime())

  return (
    <AbsenClient
      nama={pegawai.nama}
      jabatan={pegawai.jabatan}
      pengaturan={{
        jamMasuk: jamKerja.jamMasuk,
        jamPulang: jamKerja.jamPulang,
        toleransiMenit: jamKerja.toleransiMenit,
        radiusMeter: pengaturan.radiusMeter,
        namaShift: jamKerja.namaShift,
      }}
      hariIni={hariIniRow ? keBaris(hariIniRow) : null}
      riwayat={rows.map(keBaris)}
      pengajuan={daftarPengajuan.map(kePengajuan)}
    />
  )
}
