import Link from 'next/link'
import prisma from '@/lib/prisma'
import { defaultKiasTahun } from '@/lib/kias-admin'
import { KIAS_PENDIDIKAN } from '@/lib/kias'
import { TambahForm } from './TambahForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tambah Pendaftar KIAS — Admin' }

export default async function TambahKiasPage() {
  const [tahunList, kelas, tahun] = await Promise.all([
    prisma.kiasInfoPsb.findMany({ orderBy: { id: 'desc' }, select: { tahunAjaran: true } }),
    prisma.kiasProgram.findMany({ include: { jenisProgram: true }, orderBy: [{ jenisProgram: { urutan: 'asc' } }, { id: 'asc' }] }),
    defaultKiasTahun(),
  ])
  return (
    <div className="p-6 sm:p-8 space-y-5 max-w-4xl">
      <div>
        <Link href="/admin/kias/pendaftaran" className="text-sm text-gray-500 hover:text-brand-primary">← Pendaftar KIAS</Link>
        <h1 className="text-2xl font-bold text-brand-primary">Tambah Pendaftar (Susulan)</h1>
        <p className="text-sm text-gray-500">
          Pendaftar yang ditambahkan admin langsung berstatus <strong>Diterima</strong> dengan transfer <strong>Valid</strong>.
          Akun login dibuat otomatis: password = kode registrasi; bila email kosong dipakai <code>kode@kias.local</code>.
        </p>
      </div>
      <TambahForm
        tahunList={tahunList.map((t) => t.tahunAjaran)}
        defaultTahun={tahun ?? ''}
        kelas={kelas.map((k) => ({ id: k.id, label: `${k.namaProgram} (${k.jenisProgram.namaJenis})` }))}
        pendidikan={KIAS_PENDIDIKAN}
      />
    </div>
  )
}
