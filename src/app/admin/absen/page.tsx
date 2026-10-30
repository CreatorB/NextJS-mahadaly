import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ExportLink } from '@/components/admin/ExportButtons'
import { ambilRekap } from '@/lib/rekap-absensi'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Absen Kerja — Admin' }

const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  telat: 'Telat',
  izin: 'Izin',
  sakit: 'Sakit',
  alpa: 'Alpa',
}

function jamWib(d: Date | null): string {
  if (!d) return '-'
  return new Date(d.getTime() + 7 * 3600000).toISOString().slice(11, 16)
}

export default async function AdminAbsenPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string; pegawaiId?: string; status?: string }>
}) {
  const sp = await searchParams
  const pegawaiId = sp.pegawaiId ? Number(sp.pegawaiId) : undefined

  const { dari, sampai, rows, summary } = await ambilRekap({
    dari: sp.dari,
    sampai: sp.sampai,
    pegawaiId: Number.isFinite(pegawaiId) ? pegawaiId : undefined,
    status: sp.status,
  })

  const daftarPegawai = await prisma.pegawai.findMany({
    orderBy: { nama: 'asc' },
    select: { id: true, nama: true, jabatan: true },
  })

  const sel = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'

  const exportUrl = (format: string) => {
    const q = new URLSearchParams({ format })
    if (sp.dari) q.set('dari', sp.dari)
    if (sp.sampai) q.set('sampai', sp.sampai)
    if (sp.pegawaiId) q.set('pegawaiId', sp.pegawaiId)
    if (sp.status) q.set('status', sp.status)
    return `/api/admin/absen/export?${q.toString()}`
  }

  const kartu = [
    { label: 'Total Catatan', value: summary.total, warna: 'text-gray-900' },
    { label: 'Hadir', value: summary.hadir, warna: 'text-emerald-600' },
    { label: 'Telat', value: summary.telat, warna: 'text-amber-600' },
    { label: 'Izin', value: summary.izin, warna: 'text-blue-600' },
    { label: 'Sakit', value: summary.sakit, warna: 'text-violet-600' },
    { label: 'Belum Pulang', value: summary.belumPulang, warna: 'text-rose-600' },
  ]

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Absen Kerja</h1>
          <p className="text-sm text-gray-500">
            Rekap kehadiran staf pada{' '}
            {dari.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}
            {' - '}
            {sampai.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportLink href={exportUrl('xls')} label="Excel" kind="excel" />
          <ExportLink href={exportUrl('csv')} label="CSV" kind="csv" />
          <Link
            href="/admin/pegawai"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Data Pegawai
          </Link>
        </div>
      </div>

      {/* Filter */}
      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500" htmlFor="f-dari">Dari tanggal</label>
          <input id="f-dari" type="date" name="dari" defaultValue={sp.dari ?? ''} className={sel} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500" htmlFor="f-sampai">Sampai tanggal</label>
          <input id="f-sampai" type="date" name="sampai" defaultValue={sp.sampai ?? ''} className={sel} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500" htmlFor="f-pegawai">Pegawai</label>
          <select id="f-pegawai" name="pegawaiId" defaultValue={sp.pegawaiId ?? ''} className={sel}>
            <option value="">Semua pegawai</option>
            {daftarPegawai.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500" htmlFor="f-status">Status</label>
          <select id="f-status" name="status" defaultValue={sp.status ?? ''} className={sel}>
            <option value="">Semua status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white">Terapkan</button>
        <Link href="/admin/absen" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
          Reset
        </Link>
      </form>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.warna}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              {['Tanggal', 'Pegawai', 'Jabatan', 'Masuk', 'Pulang', 'Durasi', 'Metode', 'Jarak', 'Status'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                  Belum ada data absensi pada rentang ini.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const durasi =
                r.jamMasuk && r.jamPulang
                  ? `${((r.jamPulang.getTime() - r.jamMasuk.getTime()) / 3600000).toFixed(1)} jam`
                  : '-'
              return (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-gray-700">
                    {new Date(r.tanggal.getTime() + 7 * 3600000).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">{r.pegawai.nama}</td>
                  <td className="px-4 py-2 text-gray-600">{r.pegawai.jabatan ?? '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{jamWib(r.jamMasuk)}</td>
                  <td className="px-4 py-2 text-gray-600">{jamWib(r.jamPulang)}</td>
                  <td className="px-4 py-2 text-gray-600">{durasi}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.metode === 'wifi' ? 'Wi-Fi' : r.metode === 'gps' ? 'GPS' : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.jarakMeter != null ? `${r.jarakMeter} m` : '-'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        r.status === 'telat'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'izin'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'sakit'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.keterangan && <span className="ml-2 text-xs text-gray-500">{r.keterangan}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
