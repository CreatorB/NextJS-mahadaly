'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Wifi, CheckCircle2, Clock, LogIn, LogOut, CalendarOff, Loader2, TriangleAlert } from 'lucide-react'

export interface BarisAbsensi {
  id: number
  tanggal: string
  jamMasuk: string | null
  jamPulang: string | null
  metode: string | null
  jarakMeter: number | null
  status: string
  keterangan: string | null
}

export interface PengaturanView {
  jamMasuk: string
  jamPulang: string
  toleransiMenit: number
  radiusMeter: number
}

interface Props {
  nama: string
  jabatan: string | null
  pengaturan: PengaturanView
  hariIni: BarisAbsensi | null
  riwayat: BarisAbsensi[]
}

type Metode = 'gps' | 'wifi'

const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  telat: 'Telat',
  izin: 'Izin',
  sakit: 'Sakit',
  alpa: 'Alpa',
}

function jamWib(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function tanggalPanjang(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AbsenClient({ nama, jabatan, pengaturan, hariIni, riwayat }: Props) {
  const router = useRouter()
  const [metode, setMetode] = useState<Metode>('gps')
  const [loading, setLoading] = useState(false)
  const [izinOpen, setIzinOpen] = useState(false)
  const [alasan, setAlasan] = useState('')

  const sudahMasuk = Boolean(hariIni?.jamMasuk)
  const sudahPulang = Boolean(hariIni?.jamPulang)
  const labelTombol = useMemo(() => {
    if (!sudahMasuk) return 'Absen Masuk'
    if (!sudahPulang) return 'Absen Pulang'
    return 'Absen Hari Ini Selesai'
  }, [sudahMasuk, sudahPulang])

  const ambilGps = (): Promise<{ lat: number; lon: number }> =>
    new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Perangkat ini tidak mendukung GPS. Pilih metode Wi-Fi.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => {
          const pesan =
            err.code === err.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Aktifkan izin lokasi browser lalu coba lagi.'
              : err.code === err.TIMEOUT
                ? 'GPS tidak merespons. Coba lagi di area terbuka.'
                : 'Lokasi tidak bisa dibaca. Pastikan GPS perangkat aktif.'
          reject(new Error(pesan))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    })

  const ambilIp = async (): Promise<string> => {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
    if (!res.ok) throw new Error('Gagal membaca IP publik.')
    const data = (await res.json()) as { ip?: string }
    if (!data.ip) throw new Error('Gagal membaca IP publik.')
    return data.ip
  }

  const kirim = async (payload: { metode: Metode; latitude?: number; longitude?: number; ip?: string }) => {
    setLoading(true)
    try {
      const res = await fetch('/api/absen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Absen gagal disimpan.')
        return
      }
      toast.success(data.message ?? 'Absen tersimpan.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const handleAbsen = async () => {
    if (loading || sudahPulang) return
    setLoading(true)
    try {
      if (metode === 'gps') {
        const { lat, lon } = await ambilGps()
        await kirim({ metode: 'gps', latitude: lat, longitude: lon })
      } else {
        const ip = await ambilIp()
        await kirim({ metode: 'wifi', ip })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan.')
      setLoading(false)
    }
  }

  const handleIzin = async () => {
    if (alasan.trim().length < 3) {
      toast.error('Tuliskan alasan izin (minimal 3 karakter).')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/absen/izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keterangan: alasan.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Izin gagal dikirim.')
        return
      }
      toast.success(data.message ?? 'Izin terkirim.')
      setIzinOpen(false)
      setAlasan('')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Absen Kerja</h1>
        <p className="text-sm text-gray-500">
          {nama}
          {jabatan ? ` · ${jabatan}` : ''}
        </p>
      </div>

      {/* Kartu status hari ini */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{tanggalPanjang(hariIni?.tanggal ?? new Date().toISOString().slice(0, 10))}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              Jam kerja: {pengaturan.jamMasuk.slice(0, 5)} - {pengaturan.jamPulang.slice(0, 5)} WIB
              <span className="ml-2 text-sm font-normal text-gray-500">
                (toleransi telat {pengaturan.toleransiMenit} menit)
              </span>
            </p>
          </div>
          {hariIni ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                hariIni.status === 'telat'
                  ? 'bg-amber-100 text-amber-800'
                  : hariIni.status === 'izin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {hariIni.status === 'izin' ? <CalendarOff className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {STATUS_LABEL[hariIni.status] ?? hariIni.status}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
              <Clock className="h-4 w-4" />
              Belum absen
            </span>
          )}
        </div>

        {(sudahMasuk || sudahPulang) && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-brand-surface p-3">
              <p className="text-xs text-gray-500">Jam Masuk</p>
              <p className="text-lg font-semibold text-gray-900">{jamWib(hariIni?.jamMasuk ?? null)}</p>
            </div>
            <div className="rounded-xl bg-brand-surface p-3">
              <p className="text-xs text-gray-500">Jam Pulang</p>
              <p className="text-lg font-semibold text-gray-900">{jamWib(hariIni?.jamPulang ?? null)}</p>
            </div>
            <div className="rounded-xl bg-brand-surface p-3">
              <p className="text-xs text-gray-500">Metode</p>
              <p className="text-lg font-semibold text-gray-900">
                {hariIni?.metode === 'wifi' ? 'Wi-Fi' : hariIni?.metode === 'gps' ? 'GPS' : '-'}
              </p>
            </div>
            <div className="rounded-xl bg-brand-surface p-3">
              <p className="text-xs text-gray-500">Jarak ke Ma&apos;had</p>
              <p className="text-lg font-semibold text-gray-900">
                {hariIni?.jarakMeter != null ? `${hariIni.jarakMeter} m` : '-'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pilihan metode + tombol */}
      {!sudahPulang && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Metode absen</h2>
            <p className="text-sm text-gray-500">
              Pilih salah satu. GPS memakai lokasi perangkat, Wi-Fi memakai jaringan ma&apos;had.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMetode('gps')}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                metode === 'gps'
                  ? 'border-brand-primary bg-brand-surface'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <MapPin className="mt-0.5 h-5 w-5 text-brand-primary" />
              <span>
                <span className="block font-medium text-gray-900">GPS</span>
                <span className="block text-sm text-gray-500">
                  Harus dalam radius {pengaturan.radiusMeter} meter dari titik ma&apos;had.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetode('wifi')}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                metode === 'wifi'
                  ? 'border-brand-primary bg-brand-surface'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Wifi className="mt-0.5 h-5 w-5 text-brand-primary" />
              <span>
                <span className="block font-medium text-gray-900">Wi-Fi Ma&apos;had</span>
                <span className="block text-sm text-gray-500">
                  Harus terhubung ke jaringan Wi-Fi ma&apos;had.
                </span>
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAbsen}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sudahMasuk ? (
                <LogOut className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {labelTombol}
            </button>

            {!sudahMasuk && hariIni?.status !== 'izin' && (
              <button
                onClick={() => setIzinOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <CalendarOff className="h-4 w-4" />
                Ajukan Izin
              </button>
            )}
          </div>

          {izinOpen && (
            <div className="rounded-xl border border-gray-200 bg-brand-surface p-4">
              <label htmlFor="alasan-izin" className="text-sm font-medium text-gray-700">
                Alasan izin
              </label>
              <textarea
                id="alasan-izin"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={3}
                placeholder="Contoh: acara keluarga di luar kota"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <button
                onClick={handleIzin}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Kirim Izin
              </button>
            </div>
          )}

          <p className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              GPS memerlukan izin lokasi browser. Bila memakai Wi-Fi, pastikan perangkat terhubung ke
              Wi-Fi ma&apos;had (bukan data seluler / tethering).
            </span>
          </p>
        </div>
      )}

      {/* Riwayat */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Riwayat Absen (30 hari terakhir)</h2>
        </div>
        {riwayat.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Belum ada riwayat absen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-brand-surface">
                <tr>
                  {['Tanggal', 'Masuk', 'Pulang', 'Durasi', 'Metode', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riwayat.map((r) => {
                  const durasi =
                    r.jamMasuk && r.jamPulang
                      ? `${((new Date(r.jamPulang).getTime() - new Date(r.jamMasuk).getTime()) / 3600000).toFixed(1)} jam`
                      : '-'
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-gray-700">{r.tanggal}</td>
                      <td className="px-4 py-2 text-gray-600">{jamWib(r.jamMasuk)}</td>
                      <td className="px-4 py-2 text-gray-600">{jamWib(r.jamPulang)}</td>
                      <td className="px-4 py-2 text-gray-600">{durasi}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {r.metode === 'wifi' ? 'Wi-Fi' : r.metode === 'gps' ? 'GPS' : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            r.status === 'telat'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'izin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                        {r.keterangan && (
                          <span className="ml-2 text-xs text-gray-500">{r.keterangan}</span>
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
    </div>
  )
}
