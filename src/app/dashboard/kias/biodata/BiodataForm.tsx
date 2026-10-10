'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

type Key =
  | 'nama' | 'jenisKelamin' | 'tempatLahir' | 'tanggalLahir' | 'alamat' | 'noHp' | 'pendidikan' | 'pekerjaan'
  | 'namaAyah' | 'noHpAyah' | 'namaIbu' | 'noHpIbu' | 'namaWali' | 'noHpWali'
type Values = Record<Key, string>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

export function BiodataForm({ initial, pendidikan, pekerjaan }: { initial: Values; pendidikan: string[]; pekerjaan: string[] }) {
  const router = useRouter()
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)
  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((old) => ({ ...old, [k]: e.target.value }))

  const field = (k: Key, label: string, el: React.ReactNode, wide = false) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={k} className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {el}
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
    </div>
  )
  const text = (k: Key, type = 'text') => <input id={k} name={k} type={type} value={v[k]} onChange={set(k)} className={input} />

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErrors({})
        try {
          const res = await fetch('/api/kias/biodata', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(v),
          })
          const json = await res.json()
          if (!res.ok || !json.success) {
            if (json.errors) setErrors(json.errors)
            toast.error(json.message ?? 'Gagal menyimpan')
            return
          }
          toast.success(json.message)
          router.refresh()
        } catch {
          toast.error('Terjadi kesalahan jaringan')
        } finally {
          setBusy(false)
        }
      }}
      className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      {field('nama', 'Nama lengkap', text('nama'), true)}
      {field('jenisKelamin', 'Jenis kelamin', (
        <select id="jenisKelamin" name="jenisKelamin" value={v.jenisKelamin} onChange={set('jenisKelamin')} className={input}>
          <option value="Laki-Laki">Laki-laki (Ikhwan)</option>
          <option value="Perempuan">Perempuan (Akhwat)</option>
        </select>
      ))}
      {field('noHp', 'No. HP / WhatsApp', text('noHp', 'tel'))}
      {field('tempatLahir', 'Tempat lahir', text('tempatLahir'))}
      {field('tanggalLahir', 'Tanggal lahir', text('tanggalLahir', 'date'))}
      {field('pendidikan', 'Pendidikan terakhir', (
        <select id="pendidikan" name="pendidikan" value={v.pendidikan} onChange={set('pendidikan')} className={input}>
          <option value="">-- Pilih --</option>
          {pendidikan.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      ))}
      {field('pekerjaan', 'Pekerjaan', (
        <>
          <input id="pekerjaan" name="pekerjaan" list="kias-pekerjaan" value={v.pekerjaan} onChange={set('pekerjaan')} className={input} />
          <datalist id="kias-pekerjaan">{pekerjaan.map((p) => <option key={p} value={p} />)}</datalist>
        </>
      ))}
      {field('alamat', 'Alamat', <textarea id="alamat" name="alamat" rows={3} value={v.alamat} onChange={set('alamat')} className={input} />, true)}
      {field('namaAyah', 'Nama ayah', text('namaAyah'))}
      {field('noHpAyah', 'No. HP ayah', text('noHpAyah', 'tel'))}
      {field('namaIbu', 'Nama ibu', text('namaIbu'))}
      {field('noHpIbu', 'No. HP ibu', text('noHpIbu', 'tel'))}
      {field('namaWali', 'Nama wali', text('namaWali'))}
      {field('noHpWali', 'No. HP wali', text('noHpWali', 'tel'))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan biodata
        </button>
      </div>
    </form>
  )
}
