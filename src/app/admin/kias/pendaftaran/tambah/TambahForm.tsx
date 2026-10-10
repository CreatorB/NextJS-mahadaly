'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

interface Props {
  tahunList: string[]
  defaultTahun: string
  kelas: { id: number; label: string }[]
  pendidikan: string[]
}

const TEXT_FIELDS: [string, string, boolean?][] = [
  ['nama', 'Nama lengkap *'], ['noHp', 'No. HP / WA *'], ['email', 'Email (opsional)'], ['nik', 'NIK'], ['nisn', 'NISN'],
  ['tmpLahir', 'Tempat lahir'], ['pekerjaan', 'Pekerjaan'], ['namaAyah', 'Nama ayah'], ['noHpAyah', 'No. HP ayah'],
  ['namaIbu', 'Nama ibu'], ['noHpIbu', 'No. HP ibu'], ['namaWali', 'Nama wali'], ['noHpWali', 'No. HP wali'],
]

export function TambahForm({ tahunList, defaultTahun, kelas, pendidikan }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErrors({})
        const body = Object.fromEntries(new FormData(e.currentTarget).entries())
        try {
          const res = await fetch('/api/admin/kias/pendaftaran', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const json = await res.json()
          if (!res.ok || !json.success) {
            if (json.errors) setErrors(json.errors)
            toast.error(json.message ?? 'Gagal menyimpan')
            return
          }
          toast.success(json.message, { duration: 10000 })
          router.push(`/admin/kias/pendaftaran/${json.data.kodeRegistrasi}`)
        } catch {
          toast.error('Terjadi kesalahan jaringan')
        } finally {
          setBusy(false)
        }
      }}
      className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tahun ajaran *</label>
        <select name="tahunPsb" defaultValue={defaultTahun} className={input}>
          {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {err('tahunPsb')}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kelas *</label>
        <select name="programId" defaultValue="" className={input}>
          <option value="">-- Pilih kelas --</option>
          {kelas.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        {err('programId')}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Jenis kelamin *</label>
        <select name="jk" defaultValue="" className={input}>
          <option value="">-- Pilih --</option>
          <option value="Laki-Laki">Ikhwan</option>
          <option value="Perempuan">Akhwat</option>
        </select>
        {err('jk')}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal lahir</label>
        <input type="date" name="tglLahir" className={input} />
      </div>
      {TEXT_FIELDS.map(([k, label]) => (
        <div key={k}>
          <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
          <input name={k} className={input} />
          {err(k)}
        </div>
      ))}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Pendidikan</label>
        <select name="pendidikan" defaultValue="" className={input}>
          <option value="">-- Pilih --</option>
          {pendidikan.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">Alamat</label>
        <textarea name="alamat" rows={2} className={input} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Simpan pendaftar
        </button>
      </div>
    </form>
  )
}
