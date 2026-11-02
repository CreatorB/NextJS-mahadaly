'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  Users,
  CalendarDays,
} from 'lucide-react'

export interface BarisAbsensi {
  id: number | null
  tanggal: string
  pegawaiId: number
  nama: string
  jabatan: string | null
  jamMasuk: string | null
  jamPulang: string | null
  metode: string | null
  jarakMeter: number | null
  status: string
  keterangan: string | null
}

export interface RekapPegawai {
  pegawaiId: number
  nama: string
  jabatan: string | null
  jamMasuk: string
  jamPulang: string
  jamKerjaManual: boolean
  hadir: number
  telat: number
  izin: number
  sakit: number
  alpa: number
  hariMasuk: number
  totalCatatan: number
  rataRataJam: number
  durasiTargetJam: number
  belumPulang: number
}

const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  telat: 'Telat',
  izin: 'Izin',
  sakit: 'Sakit',
  alpa: 'Alpa',
}

interface Props {
  baris: BarisAbsensi[]
  perPegawai: RekapPegawai[]
  summary: Record<string, number>
  termasukTanpaAbsen: boolean
}

function jamWib(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AbsenClient({
  baris,
  perPegawai,
  summary,
  termasukTanpaAbsen,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'harian' | 'pegawai'>('harian')
  const [terpilih, setTerpilih] = useState<number[]>([])
  const [statusBaru, setStatusBaru] = useState('hadir')
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = (id: number) =>
    setTerpilih((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))

  const toggleSemua = () => {
    const ids = baris.filter((b) => b.id != null).map((b) => b.id as number)
    setTerpilih(terpilih.length === ids.length ? [] : ids)
  }

  const jalankanBulk = async (aksi: 'set-status' | 'hapus') => {
    if (terpilih.length === 0) {
      toast.error('Pilih minimal satu baris.')
      return
    }
    if (aksi === 'hapus' && !confirm(`Hapus ${terpilih.length} baris absensi?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/absen/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: terpilih, aksi, status: statusBaru, keterangan }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Aksi gagal dijalankan.')
        return
      }
      toast.success(json.message ?? 'Selesai.')
      setTerpilih([])
      setKeterangan('')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const kartu = [
    { label: 'Total Catatan', value: summary.total, warna: 'text-gray-900' },
    { label: 'Hadir', value: summary.hadir, warna: 'text-emerald-600' },
    { label: 'Telat', value: summary.telat, warna: 'text-amber-600' },
    { label: 'Izin', value: summary.izin, warna: 'text-blue-600' },
    { label: 'Sakit', value: summary.sakit, warna: 'text-violet-600' },
    { label: 'Alpa', value: summary.alpa, warna: 'text-rose-600' },
    { label: 'Tanpa Absen', value: summary.tanpaAbsen, warna: 'text-rose-700' },
    { label: 'Belum Pulang', value: summary.belumPulang, warna: 'text-orange-600' },
  ]

  const semuaId = baris.filter((b) => b.id != null).map((b) => b.id as number)
  const semuaTerpilih = semuaId.length > 0 && terpilih.length === semuaId.length

  return (
    <>
      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className={`mt-1 text-xl font-bold ${k.warna}`}>{k.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('harian')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'harian'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Rekap Harian
        </button>
        <button
          onClick={() => setTab('pegawai')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'pegawai'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Rekap per Pegawai
        </button>
      </div>

      {tab === 'harian' && (
        <>
          {terpilih.length > 0 && (
            <div className="rounded-xl border border-brand-primary/30 bg-brand-surface p-4">
              <p className="mb-3 text-sm font-semibold text-brand-primary">
                {terpilih.length} baris dipilih
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600" htmlFor="bk-status">Ubah status</label>
                  <select
                    id="bk-status"
                    value={statusBaru}
                    onChange={(e) => setStatusBaru(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600" htmlFor="bk-ket">Keterangan</label>
                  <input
                    id="bk-ket"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="opsional"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => void jalankanBulk('set-status')}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Terapkan
                </button>
                <button
                  onClick={() => void jalankanBulk('hapus')}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
                <button
                  onClick={() => setTerpilih([])}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
                >
                  Batal pilih
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-brand-surface">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">
                    <button onClick={toggleSemua} aria-label="Pilih semua">
                      {semuaTerpilih ? (
                        <CheckSquare className="h-4 w-4 text-brand-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  {['Tanggal', 'Pegawai', 'Jabatan', 'Masuk', 'Pulang', 'Durasi', 'Metode', 'Jarak', 'Status'].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {baris.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                      Belum ada data absensi pada rentang ini.
                    </td>
                  </tr>
                )}
                {baris.map((b, i) => {
                  const durasi =
                    b.jamMasuk && b.jamPulang
                      ? `${((new Date(b.jamPulang).getTime() - new Date(b.jamMasuk).getTime()) / 3600000).toFixed(1)} jam`
                      : '-'
                  return (
                    <tr key={`${b.tanggal}-${b.pegawaiId}-${i}`}>
                      <td className="px-3 py-2">
                        {b.id == null ? (
                          <span className="text-xs text-gray-300" title="Baris otomatis (tanpa absen)">
                            -
                          </span>
                        ) : (
                          <button onClick={() => toggle(b.id as number)} aria-label={`Pilih baris ${i}`}>
                            {terpilih.includes(b.id) ? (
                              <CheckSquare className="h-4 w-4 text-brand-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{b.tanggal}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{b.nama}</td>
                      <td className="px-3 py-2 text-gray-600">{b.jabatan ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{jamWib(b.jamMasuk)}</td>
                      <td className="px-3 py-2 text-gray-600">{jamWib(b.jamPulang)}</td>
                      <td className="px-3 py-2 text-gray-600">{durasi}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {b.metode === 'wifi' ? 'Wi-Fi' : b.metode === 'gps' ? 'GPS' : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {b.jarakMeter != null ? `${b.jarakMeter} m` : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            b.status === 'telat'
                              ? 'bg-amber-100 text-amber-800'
                              : b.status === 'izin'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'sakit'
                                  ? 'bg-violet-100 text-violet-800'
                                  : b.status === 'alpa'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                        {b.keterangan && (
                          <span className="ml-2 text-xs text-gray-500">{b.keterangan}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {termasukTanpaAbsen && (
            <p className="text-xs text-gray-500">
              Baris tanpa absen dihitung otomatis untuk pegawai aktif pada hari kerja (tidak bisa diedit
              di sini).
            </p>
          )}
        </>
      )}

      {tab === 'pegawai' && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-brand-surface">
              <tr>
                {[
                  'Pegawai',
                  'Jabatan',
                  'Jam Kerja',
                  'Hadir',
                  'Telat',
                  'Izin',
                  'Sakit',
                  'Alpa',
                  'Rata-rata Jam',
                  'Target Jam',
                  'Belum Pulang',
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {perPegawai.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                    Belum ada pegawai aktif.
                  </td>
                </tr>
              )}
              {perPegawai.map((p) => (
                <tr key={p.pegawaiId}>
                  <td className="px-3 py-2 font-medium text-gray-900">{p.nama}</td>
                  <td className="px-3 py-2 text-gray-600">{p.jabatan ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {p.jamMasuk.slice(0, 5)} - {p.jamPulang.slice(0, 5)}
                    {p.jamKerjaManual && (
                      <span className="ml-1 text-xs text-brand-primary">manual</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-emerald-700">{p.hadir}</td>
                  <td className="px-3 py-2 text-amber-700">{p.telat}</td>
                  <td className="px-3 py-2 text-blue-700">{p.izin}</td>
                  <td className="px-3 py-2 text-violet-700">{p.sakit}</td>
                  <td className="px-3 py-2 text-rose-700">{p.alpa}</td>
                  <td className="px-3 py-2 text-gray-600">{p.rataRataJam} jam</td>
                  <td className="px-3 py-2 text-gray-500">{p.durasiTargetJam} jam</td>
                  <td className="px-3 py-2 text-orange-700">{p.belumPulang}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
