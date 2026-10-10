import Link from 'next/link'
import prisma from '@/lib/prisma'
import { isKiasPsbOpen } from '@/lib/kias'
import { InfoPsbForm, KelasStatusToggle } from './PengaturanClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pengaturan PSB KIAS — Admin' }

const local = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')

export default async function PengaturanKiasPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  const [infos, kelas] = await Promise.all([
    prisma.kiasInfoPsb.findMany({ orderBy: { id: 'desc' } }),
    prisma.kiasProgram.findMany({ include: { jenisProgram: true }, orderBy: [{ jenisProgram: { urutan: 'asc' } }, { id: 'asc' }] }),
  ])
  const current = id === 'baru' ? null : infos.find((i) => String(i.id) === id) ?? infos[0] ?? null

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl">
      <div>
        <Link href="/admin/kias" className="text-sm text-gray-500 hover:text-brand-primary">← KIAS</Link>
        <h1 className="text-2xl font-bold text-brand-primary">Pengaturan PSB KIAS</h1>
        <p className="text-sm text-gray-500">
          Pendaftaran dibuka bila sekarang berada di antara tanggal buka–tutup; bila tanggal kosong, mengikuti status Buka/Tutup.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {infos.map((i) => (
          <Link key={i.id} href={`?id=${i.id}`}
            className={`rounded-full px-3 py-1 text-sm font-medium ${current?.id === i.id ? 'bg-brand-primary text-white' : 'border border-gray-200 bg-white text-gray-600'}`}>
            {i.tahunAjaran} {isKiasPsbOpen(i) && '· dibuka'}
          </Link>
        ))}
        <Link href="?id=baru" className={`rounded-full px-3 py-1 text-sm font-medium ${id === 'baru' ? 'bg-brand-primary text-white' : 'border border-dashed border-gray-300 text-gray-600'}`}>
          + Tahun ajaran baru
        </Link>
      </div>

      <InfoPsbForm
        key={current?.id ?? 'baru'}
        initial={
          current
            ? {
                id: current.id,
                tahunAjaran: current.tahunAjaran,
                statusPsb: current.statusPsb,
                datetimeOpen: local(current.datetimeOpen),
                datetimeClosed: local(current.datetimeClosed),
                quotaIkhwan: current.quotaIkhwan?.toString() ?? '',
                quotaAkhwat: current.quotaAkhwat?.toString() ?? '',
                biayaPendaftaran: String(current.biayaPendaftaran),
                biayaSaranaPrasarana: String(current.biayaSaranaPrasarana),
                biayaKuliahPerdana: String(current.biayaKuliahPerdana),
                biayaSppBulanan: String(current.biayaSppBulanan),
                linkGroup: current.linkGroup ?? '',
                kontenPsb: current.kontenPsb ?? '',
                manualAktif: !!current.manualPassword,
              }
            : null
        }
      />

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-gray-900">Status kelas</h2>
        <p className="mb-4 text-sm text-gray-500">Hanya kelas berstatus Buka (jenjang Tajwid, Bahasa Arab, Takmili) yang muncul di formulir pendaftaran.</p>
        <ul className="divide-y divide-gray-100">
          {kelas.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-900">{k.namaProgram}</p>
                <p className="text-xs text-gray-500">{k.jenisProgram.namaJenis} · {k.hariBelajar} {k.waktuBelajar} · {k.tempatBelajar}</p>
              </div>
              <KelasStatusToggle programId={k.id} statusPsb={k.statusPsb} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
