import prisma from '@/lib/prisma'
import { tanggalHariIniWib } from '@/lib/absensi'
import { PegawaiClient, type BarisPegawai } from './PegawaiClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Data Pegawai — Admin' }

export default async function AdminPegawaiPage() {
  const hariIni = tanggalHariIniWib()
  const sejak30Hari = new Date(hariIni.getTime() - 30 * 86400000)

  const pegawai = await prisma.pegawai.findMany({
    orderBy: { nama: 'asc' },
    include: {
      user: { select: { id: true, email: true, isActive: true, passwordChangedAt: true } },
      absensi: {
        where: { tanggal: { gte: sejak30Hari } },
        select: { tanggal: true, jamMasuk: true, jamPulang: true, status: true },
      },
    },
  })

  const data: BarisPegawai[] = pegawai.map((p) => ({
    id: p.id,
    nama: p.nama,
    jabatan: p.jabatan,
    noHp: p.noHp,
    email: p.email,
    nik: p.nik,
    jk: p.jk,
    tmpLahir: p.tmpLahir,
    pendidikan: p.pendidikan,
    statusPernikahan: p.statusPernikahan,
    alamat: p.alamat,
    tahunBergabung: p.tahunBergabung,
    kontakKeluarga: p.kontakKeluarga,
    isActive: p.isActive,
    akun: p.user
      ? {
          id: p.user.id,
          email: p.user.email,
          isActive: p.user.isActive,
          passwordSudahDiubah: Boolean(p.user.passwordChangedAt),
        }
      : null,
    absensi30Hari: {
      hadir: p.absensi.filter((a) => a.jamMasuk).length,
      telat: p.absensi.filter((a) => a.status === 'telat').length,
      total: p.absensi.length,
    },
  }))

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <PegawaiClient data={data} />
    </div>
  )
}
