'use client'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  Users,
  CalendarDays,
  Inbox,
  FileSpreadsheet,
  History,
  PlusCircle,
  MessageCircle,
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
  menitTelat?: number
  lemburMenit?: number
}

export interface RekapPegawai {
  pegawaiId: number
  nama: string
  jabatan: string | null
  jamMasuk: string
  jamPulang: string
  jamKerjaManual: boolean
  namaShift: string | null
  hadir: number
  telat: number
  izin: number
  sakit: number
  cuti: number
  alpa: number
  hariMasuk: number
  totalCatatan: number
  rataRataJam: number
  durasiTargetJam: number
  menitTelat: number
  lemburMenit: number
  belumPulang: number
}

export interface PegawaiPilih {
  id: number
  nama: string
}

export interface PengajuanAdmin {
  id: number
  pegawaiId: number
  nama: string
  jabatan: string | null
  noHp: string | null
  jenis: string
  labelJenis: string
  tanggalMulai: string
  tanggalSelesai: string
  keterangan: string
  status: string
  alasanVerifikasi: string | null
}

export interface RiwayatAudit {
  id: number
  aksi: string
  entitas: string
  namaPegawai: string | null
  keterangan: string | null
  actorNama: string | null
  createdAt: string
}

export interface BarisBulanan {
  pegawaiId: number
  nama: string
  jabatan: string | null
  hariKerja: number
  hadir: number
  telat: number
  izin: number
  sakit: number
  cuti: number
  alpa: number
  hariEfektif: number
  persenKehadiran: number
  menitTelat: number
  totalJamKerja: number
  lemburJam: number
  belumPulang: number
}

const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  telat: 'Telat',
  izin: 'Izin',
  sakit: 'Sakit',
  cuti: 'Cuti',
  alpa: 'Alpa',
}

interface Props {
  baris: BarisAbsensi[]
  perPegawai: RekapPegawai[]
  summary: Record<string, number>
  termasukTanpaAbsen: boolean
  daftarPegawai: PegawaiPilih[]
  tanggalDefault: string
}

type Tab = 'harian' | 'pegawai' | 'pengajuan' | 'bulanan' | 'riwayat'

function jamWib(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Nomor WhatsApp untuk tautan wa.me (tanpa "+", awalan 0 diganti 62). */
export function nomorWa(noHp: string | null | undefined): string | null {
  if (!noHp) return null
  const angka = noHp.replace(/\D/g, '')
  if (!angka) return null
  if (angka.startsWith('62')) return angka
  if (angka.startsWith('0')) return `62${angka.slice(1)}`
  if (angka.startsWith('8')) return `62${angka}`
  return angka
}

export function AbsenClient({
  baris,
  perPegawai,
  summary,
  termasukTanpaAbsen,
  daftarPegawai,
  tanggalDefault,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('harian')
  const [terpilih, setTerpilih] = useState<number[]>([])
  const [statusBaru, setStatusBaru] = useState('hadir')
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading] = useState(false)

  // Catatan manual
  const [manualOpen, setManualOpen] = useState(false)
  const [manualPegawai, setManualPegawai] = useState('')
  const [manualTanggal, setManualTanggal] = useState(tanggalDefault)
  const [manualStatus, setManualStatus] = useState('sakit')
  const [manualKet, setManualKet] = useState('')

  // Pengajuan
  const [pengajuan, setPengajuan] = useState<PengajuanAdmin[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [alasanTolak, setAlasanTolak] = useState('')

  // Bulanan
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7))
  const [dataBulanan, setDataBulanan] = useState<BarisBulanan[]>([])
  const [hariKerjaBulan, setHariKerjaBulan] = useState(0)

  // Riwayat
  const [riwayat, setRiwayat] = useState<RiwayatAudit[]>([])

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

  const buatCatatanManual = async () => {
    if (!manualPegawai) {
      toast.error('Pilih pegawai.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/absen/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aksi: 'buat-catatan',
          pegawaiId: Number(manualPegawai),
          tanggal: manualTanggal,
          status: manualStatus,
          keterangan: manualKet,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Catatan gagal dibuat.')
        return
      }
      toast.success(json.message ?? 'Catatan dibuat.')
      setManualOpen(false)
      setManualKet('')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const muatPengajuan = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pengajuan?status=menunggu', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && json.success) {
        setPengajuan(json.data.pengajuan ?? [])
        setTotalPending(json.data.totalPending ?? 0)
      }
    } catch {
      toast.error('Gagal memuat pengajuan.')
    }
  }, [])

  const prosesPengajuan = async (id: number, aksi: 'setujui' | 'tolak') => {
    if (aksi === 'tolak' && !alasanTolak.trim()) {
      toast.error('Tuliskan alasan penolakan.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pengajuan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aksi, alasan: alasanTolak }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Pengajuan gagal diproses.')
        return
      }
      toast.success(json.message ?? 'Selesai.')
      setAlasanTolak('')
      await muatPengajuan()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const muatBulanan = useCallback(async (bulanValue: string) => {
    try {
      const res = await fetch(`/api/admin/absen/bulanan?bulan=${bulanValue}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && json.success) {
        setDataBulanan(json.data.rows ?? [])
        setHariKerjaBulan(json.data.hariKerja ?? 0)
      }
    } catch {
      toast.error('Gagal memuat rekap bulanan.')
    }
  }, [])

  const muatRiwayat = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/riwayat?limit=120', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && json.success) setRiwayat(json.data.riwayat ?? [])
    } catch {
      toast.error('Gagal memuat riwayat.')
    }
  }, [])

  const bukaTab = (t: Tab) => {
    setTab(t)
    if (t === 'pengajuan') void muatPengajuan()
    if (t === 'bulanan') void muatBulanan(bulan)
    if (t === 'riwayat') void muatRiwayat()
  }

  const kartu = [
    { label: 'Total Catatan', value: summary.total, warna: 'text-gray-900' },
    { label: 'Hadir', value: summary.hadir, warna: 'text-emerald-600' },
    { label: 'Telat', value: summary.telat, warna: 'text-amber-600' },
    { label: 'Izin', value: summary.izin, warna: 'text-blue-600' },
    { label: 'Sakit', value: summary.sakit, warna: 'text-violet-600' },
    { label: 'Cuti', value: summary.cuti, warna: 'text-sky-600' },
    { label: 'Alpa', value: summary.alpa, warna: 'text-rose-600' },
    { label: 'Tanpa Absen', value: summary.tanpaAbsen, warna: 'text-rose-700' },
  ]

  const semuaId = baris.filter((b) => b.id != null).map((b) => b.id as number)
  const semuaTerpilih = semuaId.length > 0 && terpilih.length === semuaId.length

  const tabClass = (aktif: boolean) =>
    `inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
      aktif
        ? 'border-brand-primary text-brand-primary'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

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

      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span>Total keterlambatan: <b className="text-gray-900">{summary.menitTelat ?? 0} menit</b></span>
        <span>Total lembur: <b className="text-gray-900">{Math.round(((summary.lemburMenit ?? 0) / 60) * 10) / 10} jam</b></span>
        <span>Belum pulang: <b className="text-gray-900">{summary.belumPulang ?? 0}</b></span>
        {summary.alpaOtomatis ? (
          <span className="text-rose-600">Alpa otomatis tersimpan: <b>{summary.alpaOtomatis}</b></span>
        ) : null}
      </div>

      {/* Tab */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        <button onClick={() => bukaTab('harian')} className={tabClass(tab === 'harian')}>
          <CalendarDays className="h-4 w-4" />
          Rekap Harian
        </button>
        <button onClick={() => bukaTab('pegawai')} className={tabClass(tab === 'pegawai')}>
          <Users className="h-4 w-4" />
          Rekap per Pegawai
        </button>
        <button onClick={() => bukaTab('pengajuan')} className={tabClass(tab === 'pengajuan')}>
          <Inbox className="h-4 w-4" />
          Pengajuan {totalPending > 0 ? `(${totalPending})` : ''}
        </button>
        <button onClick={() => bukaTab('bulanan')} className={tabClass(tab === 'bulanan')}>
          <FileSpreadsheet className="h-4 w-4" />
          Rekap Bulanan
        </button>
        <button onClick={() => bukaTab('riwayat')} className={tabClass(tab === 'riwayat')}>
          <History className="h-4 w-4" />
          Riwayat Perubahan
        </button>
      </div>

      {tab === 'harian' && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setManualOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/40 bg-brand-surface px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/10"
            >
              <PlusCircle className="h-4 w-4" />
              Buat Catatan Manual
            </button>
          </div>

          {manualOpen && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Catatan manual (sakit / izin / cuti untuk hari tanpa absen)
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600" htmlFor="mn-pegawai">Pegawai</label>
                  <select
                    id="mn-pegawai"
                    value={manualPegawai}
                    onChange={(e) => setManualPegawai(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Pilih pegawai</option>
                    {daftarPegawai.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600" htmlFor="mn-tanggal">Tanggal</label>
                  <input
                    id="mn-tanggal"
                    type="date"
                    value={manualTanggal}
                    onChange={(e) => setManualTanggal(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600" htmlFor="mn-status">Status</label>
                  <select
                    id="mn-status"
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {['izin', 'sakit', 'cuti', 'alpa', 'hadir', 'telat'].map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600" htmlFor="mn-ket">Keterangan</label>
                  <input
                    id="mn-ket"
                    value={manualKet}
                    onChange={(e) => setManualKet(e.target.value)}
                    placeholder="opsional"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => void buatCatatanManual()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Catatan
                </button>
              </div>
            </div>
          )}

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
                  {[
                    'Tanggal',
                    'Pegawai',
                    'Jabatan',
                    'Masuk',
                    'Pulang',
                    'Durasi',
                    'Telat',
                    'Lembur',
                    'Metode',
                    'Status',
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {baris.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
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
                      <td className="px-3 py-2 text-amber-700">
                        {b.menitTelat ? `${b.menitTelat} mnt` : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {b.lemburMenit ? `${Math.round((b.lemburMenit / 60) * 10) / 10} jam` : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {b.metode === 'wifi' ? 'Wi-Fi' : b.metode === 'gps' ? 'GPS' : '-'}
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
                                  : b.status === 'cuti'
                                    ? 'bg-sky-100 text-sky-800'
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
              Baris tanpa absen dihitung otomatis untuk pegawai aktif pada hari kerja (hari libur tidak
              dihitung). Baris ini tidak bisa diedit; gunakan &quot;Buat Catatan Manual&quot; untuk mencatat
              sakit / izin.
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
                  'Cuti',
                  'Alpa',
                  'Rata-rata Jam',
                  'Target Jam',
                  'Menit Telat',
                  'Lembur',
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
                  <td colSpan={14} className="px-4 py-10 text-center text-gray-500">
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
                    {!p.jamKerjaManual && p.namaShift && (
                      <span className="ml-1 text-xs text-gray-500">{p.namaShift}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-emerald-700">{p.hadir}</td>
                  <td className="px-3 py-2 text-amber-700">{p.telat}</td>
                  <td className="px-3 py-2 text-blue-700">{p.izin}</td>
                  <td className="px-3 py-2 text-violet-700">{p.sakit}</td>
                  <td className="px-3 py-2 text-sky-700">{p.cuti}</td>
                  <td className="px-3 py-2 text-rose-700">{p.alpa}</td>
                  <td className="px-3 py-2 text-gray-600">{p.rataRataJam} jam</td>
                  <td className="px-3 py-2 text-gray-500">{p.durasiTargetJam} jam</td>
                  <td className="px-3 py-2 text-amber-700">{p.menitTelat}</td>
                  <td className="px-3 py-2 text-gray-600">{Math.round((p.lemburMenit / 60) * 10) / 10} jam</td>
                  <td className="px-3 py-2 text-orange-700">{p.belumPulang}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pengajuan' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600" htmlFor="alasan-tolak">Alasan penolakan (wajib bila menolak)</label>
              <input
                id="alasan-tolak"
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="contoh:Genome via WhatsApp"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => void muatPengajuan()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Muat ulang
            </button>
          </div>

          {pengajuan.length === 0 ? (
            <p className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">
              Tidak ada pengajuan yang menunggu persetujuan.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-brand-surface">
                  <tr>
                    {['Pegawai', 'Jenis', 'Periode', 'Keterangan', 'Aksi', 'WhatsApp'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pengajuan.map((p) => {
                    const wa = nomorWa(p.noHp)
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">{p.nama}</p>
                          <p className="text-xs text-gray-500">{p.jabatan ?? '-'}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{p.labelJenis}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {p.tanggalMulai === p.tanggalSelesai
                            ? p.tanggalMulai
                            : `${p.tanggalMulai} s.d. ${p.tanggalSelesai}`}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{p.keterangan}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => void prosesPengajuan(p.id, 'setujui')}
                              disabled={loading}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => void prosesPengajuan(p.id, 'tolak')}
                              disabled={loading}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {wa ? (
                            <a
                              href={`https://wa.me/${wa}?text=${encodeURIComponent(
                                `Assalamu'alaikum ${p.nama}, pengajuan ${p.labelJenis.toLowerCase()} Anda tanggal ${p.tanggalMulai} sudah diterima admin.`,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              {p.noHp}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'bulanan' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600" htmlFor="bulan">Bulan</label>
              <input
                id="bulan"
                type="month"
                value={bulan}
                onChange={(e) => { setBulan(e.target.value); void muatBulanan(e.target.value) }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <a
              href={`/api/admin/absen/bulanan?bulan=${bulan}&format=xls`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export Excel
            </a>
            <a
              href={`/api/admin/absen/bulanan?bulan=${bulan}&format=csv`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </a>
            <span className="text-xs text-gray-500">{hariKerjaBulan} hari kerja pada bulan ini</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-brand-surface">
                <tr>
                  {[
                    'Pegawai',
                    'Jabatan',
                    'Hadir',
                    'Telat',
                    'Izin',
                    'Sakit',
                    'Cuti',
                    'Alpa',
                    'Kehadiran',
                    'Menit Telat',
                    'Total Jam',
                    'Lembur',
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataBulanan.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      Belum ada data bulan ini.
                    </td>
                  </tr>
                )}
                {dataBulanan.map((r) => (
                  <tr key={r.pegawaiId}>
                    <td className="px-3 py-2 font-medium text-gray-900">{r.nama}</td>
                    <td className="px-3 py-2 text-gray-600">{r.jabatan ?? '-'}</td>
                    <td className="px-3 py-2 text-emerald-700">{r.hadir}</td>
                    <td className="px-3 py-2 text-amber-700">{r.telat}</td>
                    <td className="px-3 py-2 text-blue-700">{r.izin}</td>
                    <td className="px-3 py-2 text-violet-700">{r.sakit}</td>
                    <td className="px-3 py-2 text-sky-700">{r.cuti}</td>
                    <td className="px-3 py-2 text-rose-700">{r.alpa}</td>
                    <td className="px-3 py-2 text-gray-700">{r.persenKehadiran}%</td>
                    <td className="px-3 py-2 text-amber-700">{r.menitTelat}</td>
                    <td className="px-3 py-2 text-gray-600">{r.totalJamKerja}</td>
                    <td className="px-3 py-2 text-gray-600">{r.lemburJam}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'riwayat' && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-brand-surface">
              <tr>
                {['Waktu', 'Aksi', 'Pegawai', 'Keterangan', 'Admin'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    Belum ada riwayat perubahan.
                  </td>
                </tr>
              )}
              {riwayat.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(r.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{r.aksi}</td>
                  <td className="px-3 py-2 text-gray-700">{r.namaPegawai ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{r.keterangan ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{r.actorNama ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
