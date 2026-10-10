'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const input = 'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
const badge: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-800', valid: 'bg-green-50 text-green-800', invalid: 'bg-red-50 text-red-800' }

async function post(eventId: number, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/events/${eventId}/peserta`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json()
  if (!res.ok || !json.success) throw Object.assign(new Error(json.message ?? 'Gagal'), { errors: json.errors })
  return json
}

export function PesertaRowActions({ eventId, registrationId, status, nama }: { eventId: number; registrationId: number; status: string; nama: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const run = async (body: Record<string, unknown>) => {
    setBusy(true)
    try { await post(eventId, { ...body, registrationId }); router.refresh() } catch (e) { toast.error(e instanceof Error ? e.message : 'Gagal') } finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-2">
      <select value={status} disabled={busy} onChange={(e) => run({ action: 'status', paymentStatus: e.target.value })}
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${badge[status] ?? ''}`} aria-label="Status pendaftaran">
        <option value="pending">Menunggu</option>
        <option value="valid">Valid</option>
        <option value="invalid">Ditolak</option>
      </select>
      <button type="button" disabled={busy} title="Hapus peserta" className="p-1 text-gray-400 hover:text-red-600"
        onClick={() => window.confirm(`Hapus peserta ${nama}?`) && run({ action: 'hapus' })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function TambahPeserta({ eventId }: { eventId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
        <UserPlus className="h-4 w-4" /> Tambah peserta manual
      </button>
    )
  }
  return (
    <form
      className="flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErrors({})
        const body = Object.fromEntries(new FormData(e.currentTarget).entries())
        try {
          await post(eventId, { action: 'tambah', ...body })
          toast.success('Peserta ditambahkan')
          setOpen(false)
          router.refresh()
        } catch (err) {
          setErrors((err as { errors?: Record<string, string[]> }).errors ?? {})
          toast.error(err instanceof Error ? err.message : 'Gagal')
        } finally {
          setBusy(false)
        }
      }}
    >
      {[['name', 'Nama'], ['phone', 'No. HP'], ['email', 'Email']].map(([k, ph]) => (
        <div key={k} className="min-w-40 flex-1">
          <input name={k} placeholder={ph} className={`${input} w-full`} />
          {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
        </div>
      ))}
      <select name="gender" className={input} defaultValue="Laki-Laki" aria-label="Jenis kelamin">
        <option value="Laki-Laki">Ikhwan</option>
        <option value="Perempuan">Akhwat</option>
      </select>
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Simpan
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 py-2 text-sm text-gray-500">Batal</button>
    </form>
  )
}
