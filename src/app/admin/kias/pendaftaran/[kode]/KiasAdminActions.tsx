'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, MessageCircle, Save, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_SANTRI = ['Aktif', 'Alumni', 'Tidak Lulus Tes', 'Mengundurkan Diri', 'DO']
const badge: Record<string, string> = {
  Menunggu: 'bg-yellow-100 text-yellow-800', Diterima: 'bg-green-100 text-green-800', Ditolak: 'bg-red-100 text-red-800',
  Cek: 'bg-orange-100 text-orange-800', Valid: 'bg-green-100 text-green-800', Invalid: 'bg-red-100 text-red-800',
}
const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

interface Props {
  kode: string
  statusPendaftaran: string
  statusTransfer: string
  alasan: string | null
  nominal: string
  tglVerifikasi: string
  kirimNotifikasi: boolean
  waLink: string | null
  kelas: { id: number; namaProgram: string }[]
  edit: { nama: string; jk: string; nik: string; email: string; noHp: string; programId: number; status: string }
}

export function KiasAdminActions(p: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [alasanTolak, setAlasanTolak] = useState('')
  const [alasanTransfer, setAlasanTransfer] = useState(p.statusTransfer === 'Invalid' ? p.alasan ?? '' : '')
  const [form, setForm] = useState(p.edit)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const url = `/api/admin/kias/pendaftaran/${p.kode}`

  const send = async (key: string, body: Record<string, unknown>, method = 'PATCH') => {
    setBusy(key)
    setErrors({})
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal')
        return false
      }
      if (json.message) toast.success(json.message)
      router.refresh()
      return true
    } catch {
      toast.error('Terjadi kesalahan jaringan')
      return false
    } finally {
      setBusy(null)
    }
  }

  const spin = (k: string) => busy === k && <Loader2 className="h-4 w-4 animate-spin" />

  return (
    <aside className="space-y-4">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pendaftaran</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[p.statusPendaftaran]}`}>{p.statusPendaftaran}</span>
        </div>
        <p className="text-xs text-gray-500">Diverifikasi: {p.tglVerifikasi}</p>
        {p.statusPendaftaran === 'Ditolak' && p.alasan && <p className="text-sm text-red-600">Alasan: {p.alasan}</p>}
        <button type="button" disabled={!!busy || p.statusPendaftaran === 'Diterima'} onClick={() => send('terima', { action: 'terima' })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
          {spin('terima') || <CheckCircle2 className="h-4 w-4" />} Terima (transfer otomatis Valid)
        </button>
        <textarea value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)} rows={2} placeholder="Alasan penolakan" className={input} />
        {errors.alasan && busy === null && <p className="text-xs text-red-600">{errors.alasan[0]}</p>}
        <button type="button" disabled={!!busy || !alasanTolak.trim()} onClick={() => send('tolak', { action: 'tolak', alasan: alasanTolak })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
          {spin('tolak') || <XCircle className="h-4 w-4" />} Tolak pendaftaran
        </button>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transfer</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[p.statusTransfer]}`}>{p.statusTransfer}</span>
        </div>
        <p className="text-sm text-gray-600">Nominal: <strong>{p.nominal}</strong></p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={!!busy || p.statusTransfer === 'Valid'} onClick={() => send('valid', { action: 'transfer', status: 'Valid' })}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {spin('valid')} Valid
          </button>
          <button type="button" disabled={!!busy || !alasanTransfer.trim()} onClick={() => send('invalid', { action: 'transfer', status: 'Invalid', alasan: alasanTransfer })}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">
            {spin('invalid')} Invalid
          </button>
        </div>
        <input value={alasanTransfer} onChange={(e) => setAlasanTransfer(e.target.value)} placeholder="Alasan bila invalid" className={input} />
        {p.waLink && (
          <a href={p.waLink} target="_blank" rel="noopener noreferrer" onClick={() => send('wa', { action: 'notifikasi-wa' })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            <MessageCircle className="h-4 w-4" /> Kirim konfirmasi WhatsApp{p.kirimNotifikasi ? ' (sudah pernah)' : ''}
          </a>
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Ubah data</h2>
        {([['nama', 'Nama'], ['nik', 'NIK'], ['email', 'Email (login)'], ['noHp', 'No. HP']] as const).map(([k, label]) => (
          <div key={k}>
            <label className="mb-1 block text-xs text-gray-600">{label}</label>
            <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={input} />
            {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <select value={form.jk} onChange={(e) => setForm({ ...form, jk: e.target.value })} className={input} aria-label="Jenis kelamin">
            <option value="Laki-Laki">Ikhwan</option>
            <option value="Perempuan">Akhwat</option>
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={input} aria-label="Status santri">
            {STATUS_SANTRI.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <select value={form.programId} onChange={(e) => setForm({ ...form, programId: Number(e.target.value) })} className={input} aria-label="Kelas">
          {p.kelas.map((k) => <option key={k.id} value={k.id}>{k.namaProgram}</option>)}
        </select>
        <button type="button" disabled={!!busy} onClick={() => send('ubah', { action: 'ubah', ...form })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {spin('ubah') || <Save className="h-4 w-4" />} Simpan perubahan
        </button>
      </section>

      <button type="button" disabled={!!busy}
        onClick={async () => {
          if (!window.confirm('Hapus pendaftar ini beserta akun dan berkasnya? Tindakan ini tidak bisa dibatalkan.')) return
          if (await send('hapus', {}, 'DELETE')) router.push('/admin/kias/pendaftaran')
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
        {spin('hapus') || <Trash2 className="h-4 w-4" />} Hapus pendaftar
      </button>
    </aside>
  )
}
