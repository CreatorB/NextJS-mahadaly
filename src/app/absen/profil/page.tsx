import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ambilPegawaiDariUserId } from '@/lib/pegawai'
import { ProfilClient } from './ProfilClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Profil Saya — Ma\'had Aly' }

export default async function ProfilPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/absen/profil')

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

  const passwordAwal = !pegawai.user?.passwordChangedAt

  return (
    <ProfilClient
      passwordAwal={passwordAwal}
      profil={{
        id: pegawai.id,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        noHp: pegawai.noHp,
        email: pegawai.email,
        nik: pegawai.nik,
        jk: pegawai.jk,
        tmpLahir: pegawai.tmpLahir,
        pendidikan: pegawai.pendidikan,
        statusPernikahan: pegawai.statusPernikahan,
        alamat: pegawai.alamat,
        tahunBergabung: pegawai.tahunBergabung,
        kontakKeluarga: pegawai.kontakKeluarga,
        akunEmail: pegawai.user?.email ?? null,
      }}
    />
  )
}
