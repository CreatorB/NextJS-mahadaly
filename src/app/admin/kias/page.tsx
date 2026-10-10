import Link from 'next/link'
import { Users, Clock, CheckCircle2, XCircle, Wallet, Settings, UserPlus, ListChecks } from 'lucide-react'
import prisma from '@/lib/prisma'
import { defaultKiasTahun } from '@/lib/kias-admin'
import { getActiveKiasInfo, isKiasPsbOpen } from '@/lib/kias'
import { TahunSelect } from './TahunSelect'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'KIAS — Admin' }

export default async function AdminKiasDashboard({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const sp = await searchParams
  const [tahunList, active] = await Promise.all([
    prisma.kiasInfoPsb.findMany({ orderBy: { id: 'desc' }, select: { tahunAjaran: true } }),
    getActiveKiasInfo(),
  ])
  const tahun = sp.tahun ?? (await defaultKiasTahun()) ?? ''
  const where = { tahunPsb: tahun }

  const [grouped, transfer, gender, perKelas, kelas] = await Promise.all([
    prisma.kiasSantri.groupBy({ by: ['statusPendaftaran'], where, _count: true }),
    prisma.kiasSantri.groupBy({ by: ['statusTransfer'], where, _count: true }),
    prisma.kiasSantri.groupBy({ by: ['jk'], where, _count: true }),
    prisma.kiasSantri.groupBy({ by: ['programId', 'statusPendaftaran'], where, _count: true }),
    prisma.kiasProgram.findMany({ include: { jenisProgram: true }, orderBy: [{ jenisProgram: { urutan: 'asc' } }, { id: 'asc' }] }),
  ])
  const total = grouped.reduce((n, g) => n + g._count, 0)
  const st = (s: string) => grouped.find((g) => g.statusPendaftaran === s)?._count ?? 0
  const tr = (s: string) => transfer.find((g) => g.statusTransfer === s)?._count ?? 0
  const jk = (s: string) => gender.find((g) => g.jk === s)?._count ?? 0

  const cards = [
    { label: 'Total pendaftar', value: total, icon: Users, cls: 'bg-brand-primary/10 text-brand-primary', href: `/admin/kias/pendaftaran?tahun=${tahun}` },
    { label: 'Menunggu', value: st('Menunggu'), icon: Clock, cls: 'bg-yellow-100 text-yellow-700', href: `/admin/kias/pendaftaran?tahun=${tahun}&status=Menunggu` },
    { label: 'Diterima', value: st('Diterima'), icon: CheckCircle2, cls: 'bg-green-100 text-green-700', href: `/admin/kias/pendaftaran?tahun=${tahun}&status=Diterima` },
    { label: 'Ditolak', value: st('Ditolak'), icon: XCircle, cls: 'bg-red-100 text-red-700', href: `/admin/kias/pendaftaran?tahun=${tahun}&status=Ditolak` },
    { label: 'Transfer perlu dicek', value: tr('Cek'), icon: Wallet, cls: 'bg-orange-100 text-orange-700', href: `/admin/kias/pendaftaran?tahun=${tahun}&transfer=Cek` },
  ]

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">KIAS</h1>
          <p className="text-sm text-gray-500">
            PSB aktif: <strong>{active?.tahunAjaran ?? '-'}</strong> —{' '}
            {isKiasPsbOpen(active) ? <span className="text-green-700 font-semibold">dibuka</span> : <span className="text-gray-600 font-semibold">ditutup</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TahunSelect value={tahun} options={tahunList.map((t) => t.tahunAjaran)} />
          <Link href="/admin/kias/pendaftaran" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"><ListChecks className="h-4 w-4" /> Pendaftar</Link>
          <Link href="/admin/kias/pendaftaran/tambah" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"><UserPlus className="h-4 w-4" /> Tambah</Link>
          <Link href="/admin/kias/pengaturan" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"><Settings className="h-4 w-4" /> Pengaturan PSB</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, cls, href }) => (
          <Link key={label} href={href} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md">
            <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${cls}`}><Icon className="h-5 w-5" /></span>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-900">Ikhwan / Akhwat</h2>
          <p className="text-sm">Ikhwan: <strong>{jk('Laki-Laki')}</strong>{active?.tahunAjaran === tahun && active.quotaIkhwan != null && <span className="text-gray-500"> / kuota {active.quotaIkhwan}</span>}</p>
          <p className="text-sm">Akhwat: <strong>{jk('Perempuan')}</strong>{active?.tahunAjaran === tahun && active.quotaAkhwat != null && <span className="text-gray-500"> / kuota {active.quotaAkhwat}</span>}</p>
          <h2 className="mb-2 mt-5 font-semibold text-gray-900">Transfer</h2>
          <p className="text-sm">Valid {tr('Valid')} · Cek {tr('Cek')} · Invalid {tr('Invalid')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Kelas</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Status PSB</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Menunggu</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Diterima</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kelas.map((k) => {
                const rows = perKelas.filter((p) => p.programId === k.id)
                const n = (s?: string) => rows.filter((r) => !s || r.statusPendaftaran === s).reduce((a, r) => a + r._count, 0)
                return (
                  <tr key={k.id}>
                    <td className="px-4 py-2">
                      <Link href={`/admin/kias/pendaftaran?tahun=${tahun}&program=${k.id}`} className="font-medium text-brand-primary hover:underline">{k.namaProgram}</Link>
                      <span className="block text-xs text-gray-500">{k.jenisProgram.namaJenis}</span>
                    </td>
                    <td className="px-4 py-2">{k.statusPsb}</td>
                    <td className="px-4 py-2 text-right">{n('Menunggu')}</td>
                    <td className="px-4 py-2 text-right">{n('Diterima')}</td>
                    <td className="px-4 py-2 text-right font-semibold">{n()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
