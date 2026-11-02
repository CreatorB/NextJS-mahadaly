import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ExportLink } from '@/components/admin/ExportButtons'
import { ambilRekap } from '@/lib/rekap-absensi'
import { AbsenClient } from './AbsenClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Absen Kerja — Admin' }

export default async function AdminAbsenPage({
  searchParams,
}: {
  searchParams: Promise<{
    dari?: string
    sampai?: string
    pegawaiId?: string
    status?: string
    tanpaAbsen?: string
  }>
}) {
  const sp = await searchParams
  const pegawaiId = sp.pegawaiId ? Number(sp.pegawaiId) : undefined
  const termasukTanpaAbsen = sp.tanpaAbsen === '1'

  const { dari, sampai, rows, summary, perPegawai, tanpaAbsen } = await ambilRekap({
    dari: sp.dari,
    sampai: sp.sampai,
    pegawaiId: Number.isFinite(pegawaiId) ? pegawaiId : undefined,
    status: sp.status,
    includeTanpaAbsen: termasukTanpaAbsen,
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

  const baris = [
    ...rows.map((r) => ({
      id: r.id,
      tanggal: new Date(r.tanggal.getTime() + 7 * 3600000).toISOString().slice(0, 10),
      pegawaiId: r.pegawai.id,
      nama: r.pegawai.nama,
      jabatan: r.pegawai.jabatan,
      jamMasuk: r.jamMasuk ? r.jamMasuk.toISOString() : null,
      jamPulang: r.jamPulang ? r.jamPulang.toISOString() : null,
      metode: r.metode,
      jarakMeter: r.jarakMeter,
      status: r.status,
      keterangan: r.keterangan,
    })),
    ...tanpaAbsen.map((t) => ({
      id: null as number | null,
      tanggal: new Date((t.tanggal as Date).getTime() + 7 * 3600000).toISOString().slice(0, 10),
      pegawaiId: t.pegawaiId as number,
      nama: t.nama as string,
      jabatan: t.jabatan as string | null,
      jamMasuk: null,
      jamPulang: null,
      metode: null,
      jarakMeter: null,
      status: t.status as string,
      keterangan: t.keterangan as string | null,
    })),
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
            {' · '}
            {summary.hariKerja} hari kerja
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
          <Link
            href="/admin/pengaturan-absensi"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Pengaturan
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
            <option value="hadir">Hadir</option>
            <option value="telat">Telat</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
            <option value="alpa">Alpa</option>
          </select>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            name="tanpaAbsen"
            value="1"
            defaultChecked={termasukTanpaAbsen}
            className="h-4 w-4 rounded border-gray-300"
          />
          Tampilkan tanpa absen
        </label>
        <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white">Terapkan</button>
        <Link href="/admin/absen" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
          Reset
        </Link>
      </form>

      <AbsenClient
        baris={baris}
        perPegawai={perPegawai.map((p) => ({
          pegawaiId: p.pegawaiId,
          nama: p.nama,
          jabatan: p.jabatan,
          jamMasuk: p.jamMasuk,
          jamPulang: p.jamPulang,
          jamKerjaManual: p.jamKerjaManual,
          hadir: p.hadir,
          telat: p.telat,
          izin: p.izin,
          sakit: p.sakit,
          alpa: p.alpa,
          hariMasuk: p.hariMasuk,
          totalCatatan: p.totalCatatan,
          rataRataJam: p.rataRataJam,
          durasiTargetJam: p.durasiTargetJam,
          belumPulang: p.belumPulang,
        }))}
        summary={summary}
        termasukTanpaAbsen={termasukTanpaAbsen}
      />
    </div>
  )
}
