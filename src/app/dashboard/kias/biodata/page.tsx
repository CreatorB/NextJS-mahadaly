import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { KIAS_PENDIDIKAN, normalizeNoHp } from '@/lib/kias'
import { BiodataForm } from './BiodataForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Biodata KIAS' }

export default async function KiasBiodataPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { kiasSantri: true } })
  const s = user?.kiasSantri
  if (!s) redirect('/dashboard')
  const pekerjaan = await prisma.kiasPekerjaan.findMany({ orderBy: { nama: 'asc' } })

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard/kias" className="text-sm text-gray-500 hover:text-brand-primary">← Dashboard KIAS</Link>
        <h1 className="mt-1 text-2xl font-bold text-brand-primary">Biodata</h1>
        <p className="text-sm text-gray-500">
          Email, NIK, program, dan tahun ajaran hanya dapat diubah oleh admin. Hubungi panitia bila ada kesalahan.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
        <p><span className="text-gray-500">No. Peserta:</span> <strong className="font-mono">{s.kodeRegistrasi}</strong></p>
        <p><span className="text-gray-500">Email:</span> {s.email ?? '-'}</p>
        <p><span className="text-gray-500">NIK:</span> {s.nik ?? '-'}</p>
        <p><span className="text-gray-500">Tahun ajaran:</span> {s.tahunPsb}</p>
      </div>
      <BiodataForm
        pendidikan={KIAS_PENDIDIKAN}
        pekerjaan={pekerjaan.map((p) => p.nama)}
        initial={{
          nama: s.nama,
          jenisKelamin: s.jk,
          tempatLahir: s.tmpLahir ?? '',
          tanggalLahir: s.tglLahir ? s.tglLahir.toISOString().slice(0, 10) : '',
          alamat: s.alamat ?? '',
          noHp: s.noHp ? `0${normalizeNoHp(s.noHp)}` : '',
          pendidikan: s.pendidikan ?? '',
          pekerjaan: s.pekerjaan ?? '',
          namaAyah: s.namaAyah ?? '',
          noHpAyah: s.noHpAyah ?? '',
          namaIbu: s.namaIbu ?? '',
          noHpIbu: s.noHpIbu ?? '',
          namaWali: s.namaWali ?? '',
          noHpWali: s.noHpWali ?? '',
        }}
      />
    </div>
  )
}
