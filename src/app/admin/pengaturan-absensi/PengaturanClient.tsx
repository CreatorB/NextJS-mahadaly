'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, MapPin, Clock, Wifi, CalendarDays } from 'lucide-react'
import { NAMA_HARI } from '@/lib/hari'

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
  }
}

export function PengaturanClient({ awal }: Props) {
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
  })
  const [hariKerja, setHariKerja] = useState<number[]>(awal.hariKerja)

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

  const sel = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Pengaturan Absen Kerja</h1>
        <p className="text-sm text-gray-500">
          Jam kerja global, radius GPS, dan Wi-Fi ma&apos;had. Jam kerja per pegawai bisa diatur
          terpisah di halaman <span className="font-medium">Pegawai</span>.
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
