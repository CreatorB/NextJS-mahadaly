'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  MapPin,
  Clock,
  Wifi,
  CalendarDays,
  Plus,
  Trash2,
  Timer,
  CalendarOff,
} from 'lucide-react'
import { NAMA_HARI } from '@/lib/hari'

interface ShiftItem {
  id: number
  nama: string
  jamMasuk: string
  jamPulang: string
  toleransiMenit: number
  jamIstirahatMulai: string | null
  jamIstirahatSelesai: string | null
}

interface LiburItem {
  id: number
  tanggal: string
  nama: string
  jenis: string
}

interface PegawaiItem {
  id: number
  nama: string
}

interface Props {
  awal: {
    jamMasuk: string
    jamPulang: string
    toleransiMenit: number
    latitude: number
    longitude: number
    radiusMeter: number
    wifiIps: string[]
    hariKerja: number[]
    batasTelatMenit: number
    batasAlpaHari: number
    autoSimpanAlpa: boolean
    defaultShiftId: number | null
  }
  shift: ShiftItem[]
  hariLibur: LiburItem[]
  pegawai: PegawaiItem[]
  jadwal: Array<{ pegawaiId: number; hari: number; shiftId: number }>
}

export function PengaturanClient({ awal, shift, hariLibur, pegawai, jadwal }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    jamMasuk: awal.jamMasuk.slice(0, 5),
    jamPulang: awal.jamPulang.slice(0, 5),
    toleransiMenit: String(awal.toleransiMenit),
    latitude: String(awal.latitude),
    longitude: String(awal.longitude),
    radiusMeter: String(awal.radiusMeter),
    wifiIps: awal.wifiIps.join(', '),
    batasTelatMenit: String(awal.batasTelatMenit),
    batasAlpaHari: String(awal.batasAlpaHari),
    autoSimpanAlpa: awal.autoSimpanAlpa,
    defaultShiftId: awal.defaultShiftId ? String(awal.defaultShiftId) : '',
  })
  const [hariKerja, setHariKerja] = useState<number[]>(awal.hariKerja)

  // Form shift
  const [shiftForm, setShiftForm] = useState({
    nama: '',
    jamMasuk: '07:00',
    jamPulang: '15:00',
    toleransiMenit: '5',
    jamIstirahatMulai: '',
    jamIstirahatSelesai: '',
  })

  // Form hari libur
  const [liburForm, setLiburForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    tanggalSelesai: '',
    nama: '',
    jenis: 'libur',
  })

  // Jadwal shift pegawai
  const [jadwalPegawai, setJadwalPegawai] = useState('')
  const [jadwalHari, setJadwalHari] = useState(1)
  const [jadwalShift, setJadwalShift] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleHari = (n: number) =>
    setHariKerja((h) => (h.includes(n) ? h.filter((x) => x !== n) : [...h, n].sort((a, b) => a - b)))

  const simpan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pengaturan-absensi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jamMasuk: form.jamMasuk,
          jamPulang: form.jamPulang,
          toleransiMenit: Number(form.toleransiMenit),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radiusMeter: Number(form.radiusMeter),
          wifiIps: form.wifiIps.split(',').map((x) => x.trim()).filter(Boolean),
          hariKerja,
          batasTelatMenit: Number(form.batasTelatMenit),
          batasAlpaHari: Number(form.batasAlpaHari),
          autoSimpanAlpa: form.autoSimpanAlpa,
          defaultShiftId: form.defaultShiftId ? Number(form.defaultShiftId) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Pengaturan gagal disimpan.')
        return
      }
      toast.success(data.message ?? 'Pengaturan tersimpan.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const tambahShift = async () => {
    if (!shiftForm.nama.trim()) {
      toast.error('Nama shift wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: shiftForm.nama,
          jamMasuk: shiftForm.jamMasuk,
          jamPulang: shiftForm.jamPulang,
          toleransiMenit: Number(shiftForm.toleransiMenit),
          jamIstirahatMulai: shiftForm.jamIstirahatMulai || null,
          jamIstirahatSelesai: shiftForm.jamIstirahatSelesai || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Shift gagal dibuat.')
        return
      }
      toast.success(data.message ?? 'Shift dibuat.')
      setShiftForm({ ...shiftForm, nama: '' })
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const hapusShift = async (id: number) => {
    if (!confirm('Hapus shift ini? Jadwal pegawai yang memakainya ikut terhapus.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/shift?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Shift gagal dihapus.')
        return
      }
      toast.success(data.message ?? 'Shift dihapus.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const tambahLibur = async () => {
    if (!liburForm.nama.trim()) {
      toast.error('Nama hari libur wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hari-libur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: liburForm.tanggal,
          tanggalSelesai: liburForm.tanggalSelesai || liburForm.tanggal,
          nama: liburForm.nama,
          jenis: liburForm.jenis,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Hari libur gagal disimpan.')
        return
      }
      toast.success(data.message ?? 'Hari libur disimpan.')
      setLiburForm({ ...liburForm, nama: '' })
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const hapusLibur = async (id: number) => {
    if (!confirm('Hapus hari libur ini?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/hari-libur?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Hari libur gagal dihapus.')
        return
      }
      toast.success(data.message ?? 'Hari libur dihapus.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const simpanJadwal = async () => {
    if (!jadwalPegawai) {
      toast.error('Pilih pegawai.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pegawaiIds: [Number(jadwalPegawai)],
          hari: jadwalHari,
          shiftId: jadwalShift ? Number(jadwalShift) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Jadwal gagal disimpan.')
        return
      }
      toast.success(data.message ?? 'Jadwal disimpan.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const shiftPegawai = (pegawaiId: number, hari: number) =>
    jadwal.find((j) => j.pegawaiId === pegawaiId && j.hari === hari)?.shiftId ?? null

  const sel = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
  const selKecil = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Pengaturan Absen Kerja</h1>
        <p className="text-sm text-gray-500">
          Jam kerja global, aturan otomatis, shift, hari libur, radius GPS, dan Wi-Fi ma&apos;had. Jam
          kerja manual per pegawai tetap diatur di halaman <span className="font-medium">Pegawai</span>.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Jam kerja */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            <h2 className="font-semibold text-gray-900">Jam Kerja Global</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-masuk">Jam Masuk</label>
              <input id="p-masuk" type="time" className={sel} value={form.jamMasuk} onChange={set('jamMasuk')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-pulang">Jam Pulang</label>
              <input id="p-pulang" type="time" className={sel} value={form.jamPulang} onChange={set('jamPulang')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-toleransi">
                Toleransi Telat (menit)
              </label>
              <input
                id="p-toleransi"
                type="number"
                min={0}
                max={240}
                className={sel}
                value={form.toleransiMenit}
                onChange={set('toleransiMenit')}
              />
              <p className="text-xs text-gray-500">Absen setelah jam masuk + toleransi ditandai Telat.</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-shift-default">
                Shift default
              </label>
              <select
                id="p-shift-default"
                className={sel}
                value={form.defaultShiftId}
                onChange={(e) => setForm((f) => ({ ...f, defaultShiftId: e.target.value }))}
              >
                <option value="">Tidak ada (pakai jam global)</option>
                {shift.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.jamMasuk.slice(0, 5)} - {s.jamPulang.slice(0, 5)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Dipakai bila pegawai tidak punya jadwal shift per hari.
              </p>
            </div>
          </div>
        </section>

        {/* Aturan otomatis */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Timer className="h-5 w-5 text-brand-primary" />
            <h2 className="font-semibold text-gray-900">Aturan Otomatis</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-batas-telat">
                Batas telat jadi alpa (menit)
              </label>
              <input
                id="p-batas-telat"
                type="number"
                min={0}
                max={240}
                className={sel}
                value={form.batasTelatMenit}
                onChange={set('batasTelatMenit')}
              />
              <p className="text-xs text-gray-500">
                0 = telat tetap berstatus Telat. Di atas 0, keterlambatan melebihi batas dihitung alpa.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-batas-alpa">
                Batas konfirmasi alpa (hari)
              </label>
              <input
                id="p-batas-alpa"
                type="number"
                min={0}
                max={30}
                className={sel}
                value={form.batasAlpaHari}
                onChange={set('batasAlpaHari')}
              />
              <p className="text-xs text-gray-500">
                Hari kerja yang lewat lebih dari batas ini otomatis berstatus alpa bila tidak ada
                keterangan.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={form.autoSimpanAlpa}
                onChange={(e) => setForm((f) => ({ ...f, autoSimpanAlpa: e.target.checked }))}
              />
              Simpan otomatis catatan alpa (butuh syarat di atas)
            </label>
          </div>
        </section>

        {/* Radius GPS */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-primary" />
            <h2 className="font-semibold text-gray-900">Radius GPS</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-lat">Latitude</label>
              <input id="p-lat" className={sel} value={form.latitude} onChange={set('latitude')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-lon">Longitude</label>
              <input id="p-lon" className={sel} value={form.longitude} onChange={set('longitude')} />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="p-radius">
                Radius (meter)
              </label>
              <input
                id="p-radius"
                type="number"
                min={10}
                max={5000}
                className={sel}
                value={form.radiusMeter}
                onChange={set('radiusMeter')}
              />
              <p className="text-xs text-gray-500">
                Absen GPS hanya boleh di dalam radius ini dari titik ma&apos;had.
              </p>
            </div>
          </div>
        </section>

        {/* Wi-Fi */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wifi className="h-5 w-5 text-brand-primary" />
            <h2 className="font-semibold text-gray-900">IP Wi-Fi Ma&apos;had</h2>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-ip">
              Daftar IP publik (pisahkan dengan koma)
            </label>
            <input
              id="p-ip"
              className={sel}
              value={form.wifiIps}
              onChange={set('wifiIps')}
              placeholder="103.178.146.98, 103.178.146.99"
            />
            <p className="text-xs text-gray-500">
              Absen Wi-Fi hanya sah bila IP publik perangkat ada di daftar ini.
            </p>
          </div>
        </section>

        {/* Hari kerja */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand-primary" />
            <h2 className="font-semibold text-gray-900">Hari Kerja</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {NAMA_HARI.map((nama, i) => {
              const aktif = hariKerja.includes(i)
              return (
                <button
                  key={nama}
                  type="button"
                  onClick={() => toggleHari(i)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    aktif
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {nama}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Hari kerja dipakai untuk menghitung otomatis pegawai yang tidak absen pada rekap.
          </p>
        </section>
      </div>

      {/* Shift kerja */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Shift Kerja</h2>
        <p className="mb-4 text-xs text-gray-500">
          Shift dipakai untuk jam kerja per hari (mis. shift pagi untuk hari kerja, shift siang untuk
          akhir pekan). Jadwal per pegawai diatur di bawah.
        </p>

        <div className="mb-4 grid gap-3 sm:grid-cols-6">
          <input
            className={sel}
            placeholder="Nama shift"
            value={shiftForm.nama}
            onChange={(e) => setShiftForm((f) => ({ ...f, nama: e.target.value }))}
          />
          <input
            type="time"
            className={sel}
            value={shiftForm.jamMasuk}
            onChange={(e) => setShiftForm((f) => ({ ...f, jamMasuk: e.target.value }))}
          />
          <input
            type="time"
            className={sel}
            value={shiftForm.jamPulang}
            onChange={(e) => setShiftForm((f) => ({ ...f, jamPulang: e.target.value }))}
          />
          <input
            type="number"
            className={sel}
            placeholder="Toleransi (mnt)"
            value={shiftForm.toleransiMenit}
            onChange={(e) => setShiftForm((f) => ({ ...f, toleransiMenit: e.target.value }))}
          />
          <input
            type="time"
            className={sel}
            placeholder="Istirahat mulai"
            value={shiftForm.jamIstirahatMulai}
            onChange={(e) => setShiftForm((f) => ({ ...f, jamIstirahatMulai: e.target.value }))}
          />
          <input
            type="time"
            className={sel}
            placeholder="Istirahat selesai"
            value={shiftForm.jamIstirahatSelesai}
            onChange={(e) => setShiftForm((f) => ({ ...f, jamIstirahatSelesai: e.target.value }))}
          />
        </div>
        <button
          onClick={() => void tambahShift()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/40 bg-brand-surface px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Tambah Shift
        </button>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-brand-surface">
              <tr>
                {['Nama', 'Masuk', 'Pulang', 'Toleransi', 'Istirahat', ''].map((h, i) => (
                  <th key={`${h}-${i}`} className="px-3 py-2 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shift.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Belum ada shift.
                  </td>
                </tr>
              )}
              {shift.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">{s.nama}</td>
                  <td className="px-3 py-2 text-gray-600">{s.jamMasuk.slice(0, 5)}</td>
                  <td className="px-3 py-2 text-gray-600">{s.jamPulang.slice(0, 5)}</td>
                  <td className="px-3 py-2 text-gray-600">{s.toleransiMenit} mnt</td>
                  <td className="px-3 py-2 text-gray-600">
                    {s.jamIstirahatMulai && s.jamIstirahatSelesai
                      ? `${s.jamIstirahatMulai.slice(0, 5)} - ${s.jamIstirahatSelesai.slice(0, 5)}`
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => void hapusShift(s.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Jadwal shift pegawai */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Jadwal Shift Pegawai</h2>
        <p className="mb-4 text-xs text-gray-500">
          Pilih pegawai, hari, dan shift. Bila dikosongkan, pegawai memakai shift default atau jam kerja
          global.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="j-pegawai">Pegawai</label>
            <select
              id="j-pegawai"
              className={selKecil}
              value={jadwalPegawai}
              onChange={(e) => setJadwalPegawai(e.target.value)}
            >
              <option value="">Pilih pegawai</option>
              {pegawai.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="j-hari">Hari</label>
            <select
              id="j-hari"
              className={selKecil}
              value={jadwalHari}
              onChange={(e) => setJadwalHari(Number(e.target.value))}
            >
              {NAMA_HARI.map((nama, i) => (
                <option key={nama} value={i}>{nama}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="j-shift">Shift</label>
            <select
              id="j-shift"
              className={selKecil}
              value={jadwalShift}
              onChange={(e) => setJadwalShift(e.target.value)}
            >
              <option value="">Tanpa shift</option>
              {shift.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.jamMasuk.slice(0, 5)} - {s.jamPulang.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => void simpanJadwal()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Jadwal
          </button>
        </div>

        {jadwalPegawai && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-brand-surface">
                <tr>
                  {NAMA_HARI.map((nama) => (
                    <th key={nama} className="px-3 py-2 text-left font-semibold text-gray-700">
                      {nama}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  {NAMA_HARI.map((nama, i) => {
                    const shiftId = shiftPegawai(Number(jadwalPegawai), i)
                    const s = shift.find((x) => x.id === shiftId)
                    return (
                      <td key={nama} className="px-3 py-2 text-gray-600">
                        {s ? s.nama : '-'}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Hari libur */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Hari Libur / Tanggal Merah</h2>
        <p className="mb-4 text-xs text-gray-500">
          Tanggal libur tidak dihitung sebagai alpa pada rekap. Isi satu tanggal, atau isi rentang dengan
          mengisi kolom &quot;Sampai&quot;.
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="l-tanggal">Tanggal mulai</label>
            <input
              id="l-tanggal"
              type="date"
              className={selKecil}
              value={liburForm.tanggal}
              onChange={(e) => setLiburForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="l-sampai">Sampai (opsional)</label>
            <input
              id="l-sampai"
              type="date"
              min={liburForm.tanggal}
              className={selKecil}
              value={liburForm.tanggalSelesai}
              onChange={(e) => setLiburForm((f) => ({ ...f, tanggalSelesai: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="l-nama">Nama</label>
            <input
              id="l-nama"
              className={selKecil}
              placeholder="Contoh: Tahun Baru Islam"
              value={liburForm.nama}
              onChange={(e) => setLiburForm((f) => ({ ...f, nama: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="l-jenis">Jenis</label>
            <select
              id="l-jenis"
              className={selKecil}
              value={liburForm.jenis}
              onChange={(e) => setLiburForm((f) => ({ ...f, jenis: e.target.value }))}
            >
              <option value="libur">Libur</option>
              <option value="nasional">Nasional</option>
              <option value="cuti_umum">Cuti Umum</option>
            </select>
          </div>
          <button
            onClick={() => void tambahLibur()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-brand-surface">
              <tr>
                {['Tanggal', 'Nama', 'Jenis', ''].map((h, i) => (
                  <th key={`${h}-${i}`} className="px-3 py-2 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hariLibur.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    Belum ada hari libur terdaftar.
                  </td>
                </tr>
              )}
              {hariLibur.map((h) => (
                <tr key={h.id}>
                  <td className="px-3 py-2 text-gray-700">{h.tanggal}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{h.nama}</td>
                  <td className="px-3 py-2 text-gray-600">{h.jenis}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => void hapusLibur(h.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs text-gray-500">
          <CalendarOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Untuk hari libur nasional, tambahkan satu per satu. Riwayat absensi yang sudah tercatat tidak
            berubah karena hari libur ditambahkan belakangan.
          </span>
        </p>
      </section>

      <button
        onClick={simpan}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Pengaturan
      </button>
    </div>
  )
}
