'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

interface Info {
  id?: number
  tahunAjaran: string
  statusPsb: string
  datetimeOpen: string
  datetimeClosed: string
  quotaIkhwan: string
  quotaAkhwat: string
  biayaPendaftaran: string
  biayaSaranaPrasarana: string
  biayaKuliahPerdana: string
  biayaSppBulanan: string
  linkGroup: string
  kontenPsb: string
  manualAktif: boolean
}

const EMPTY: Info = {
  tahunAjaran: '', statusPsb: 'Tutup', datetimeOpen: '', datetimeClosed: '', quotaIkhwan: '', quotaAkhwat: '',
  biayaPendaftaran: '150000', biayaSaranaPrasarana: '300000', biayaKuliahPerdana: '0', biayaSppBulanan: '250000',
  linkGroup: '', kontenPsb: '', manualAktif: false,
}

export function InfoPsbForm({ initial }: { initial: Info | null }) {
  const router = useRouter()
  const [v, setV] = useState<Info>(initial ?? EMPTY)
  const [manualPassword, setManualPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const set = (k: keyof Info) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.value })
  const field = (k: keyof Info, label: string, type = 'text') => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={String(v[k])} onChange={set(k)} className={input} />
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
    </div>
  )

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErrors({})
        const body = {
          ...v,
          datetimeOpen: v.datetimeOpen ? new Date(v.datetimeOpen).toISOString() : null,
          datetimeClosed: v.datetimeClosed ? new Date(v.datetimeClosed).toISOString() : null,
          manualPassword: manualPassword || undefined,
        }
        try {
          const res = await fetch('/api/admin/kias/pengaturan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const json = await res.json()
          if (!res.ok || !json.success) {
            if (json.errors) setErrors(json.errors)
            toast.error(json.message ?? 'Gagal menyimpan')
            return
          }
          toast.success(json.message)
          setManualPassword('')
          router.push(`/admin/kias/pengaturan?id=${json.data.id}`)
          router.refresh()
        } catch {
          toast.error('Terjadi kesalahan jaringan')
        } finally {
          setBusy(false)
        }
      }}
      className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      {field('tahunAjaran', 'Tahun ajaran (contoh 2027-2028)')}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Status (dipakai bila tanggal kosong)</label>
        <select value={v.statusPsb} onChange={set('statusPsb')} className={input}>
          <option value="Buka">Buka</option>
          <option value="Tutup">Tutup</option>
        </select>
      </div>
      {field('datetimeOpen', 'Dibuka', 'datetime-local')}
      {field('datetimeClosed', 'Ditutup', 'datetime-local')}
      {field('quotaIkhwan', 'Kuota ikhwan (kosong = tanpa batas)', 'number')}
      {field('quotaAkhwat', 'Kuota akhwat (kosong = tanpa batas)', 'number')}
      {field('biayaPendaftaran', 'Biaya pendaftaran', 'number')}
      {field('biayaSaranaPrasarana', 'Biaya sarana & prasarana', 'number')}
      {field('biayaKuliahPerdana', 'Biaya kuliah perdana', 'number')}
      {field('biayaSppBulanan', 'SPP per bulan', 'number')}
      <div className="sm:col-span-2">{field('linkGroup', 'Link grup WhatsApp / spreadsheet (muncul di dashboard setelah transfer valid)')}</div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Password pendaftaran manual ({v.manualAktif ? 'aktif' : 'nonaktif'}) — isi untuk mengganti, isi “-” untuk menonaktifkan
        </label>
        <input type="password" autoComplete="new-password" value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} className={input} />
        {errors.manualPassword && <p className="mt-1 text-xs text-red-600">{errors.manualPassword[0]}</p>}
        <p className="mt-1 text-xs text-gray-500">Halaman pendaftaran manual: /kias/daftar/manual (tidak dibatasi kuota).</p>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
        </button>
      </div>
    </form>
  )
}

export function KelasStatusToggle({ programId, statusPsb }: { programId: number; statusPsb: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const buka = statusPsb === 'Buka'
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const res = await fetch('/api/admin/kias/pengaturan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId, statusPsb: buka ? 'Tutup' : 'Buka' }),
        })
        setBusy(false)
        if (res.ok) router.refresh()
        else toast.error('Gagal mengubah status kelas')
      }}
      className={`min-w-24 rounded-full px-3 py-1 text-xs font-semibold ${buka ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'} disabled:opacity-50`}
    >
      {busy ? '...' : buka ? 'Buka' : 'Tutup'}
    </button>
  )
}
