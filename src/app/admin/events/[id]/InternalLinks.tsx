'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Link {
  id: number; name: string; token: string; quotaIkhwan: number; quotaAkhwat: number
  usageIkhwan: number; usageAkhwat: number; activeFrom: string | null; activeUntil: string | null
}

const input = 'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-')

/** Link pendaftaran internal: kuota sendiri per link, tidak mengurangi kuota publik. */
export function InternalLinks({ eventId, baseUrl, links }: { eventId: number; baseUrl: string; links: Link[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ name: '', quotaIkhwan: '0', quotaAkhwat: '0', activeFrom: '', activeUntil: '' })

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Link pendaftaran internal</h2>
        <p className="text-sm text-gray-500">Untuk pendaftar susulan/undangan. Pendaftar lewat link tidak mengurangi kuota publik.</p>
      </div>
      {links.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{l.name}</p>
                <p className="text-xs text-gray-500">
                  Ikhwan {l.usageIkhwan}/{l.quotaIkhwan} · Akhwat {l.usageAkhwat}/{l.quotaAkhwat} · {fmt(l.activeFrom)} — {fmt(l.activeUntil)}
                </p>
              </div>
              <button type="button" title="Salin link" className="p-1 text-gray-500 hover:text-brand-primary"
                onClick={() => { navigator.clipboard.writeText(`${baseUrl}/${l.token}`); toast.success('Link disalin') }}>
                <Copy className="h-4 w-4" />
              </button>
              <button type="button" title="Hapus link" className="p-1 text-gray-500 hover:text-red-600"
                onClick={async () => {
                  if (!window.confirm(`Hapus link "${l.name}"?`)) return
                  const res = await fetch(`/api/admin/events/${eventId}?link=${l.id}`, { method: 'DELETE' })
                  if (res.ok) router.refresh(); else toast.error('Gagal menghapus')
                }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            const res = await fetch(`/api/admin/events/${eventId}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ link: { ...f, activeFrom: f.activeFrom ? new Date(f.activeFrom).toISOString() : null, activeUntil: f.activeUntil ? new Date(f.activeUntil).toISOString() : null } }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) { toast.error(json.message ?? 'Gagal'); return }
            toast.success(json.message)
            setF({ name: '', quotaIkhwan: '0', quotaAkhwat: '0', activeFrom: '', activeUntil: '' })
            router.refresh()
          } finally {
            setBusy(false)
          }
        }}
      >
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nama link (mis. susulan)" className={`${input} min-w-40 flex-1`} />
        <input type="number" min={0} value={f.quotaIkhwan} onChange={(e) => setF({ ...f, quotaIkhwan: e.target.value })} className={`${input} w-24`} title="Kuota ikhwan" />
        <input type="number" min={0} value={f.quotaAkhwat} onChange={(e) => setF({ ...f, quotaAkhwat: e.target.value })} className={`${input} w-24`} title="Kuota akhwat" />
        <input type="datetime-local" value={f.activeFrom} onChange={(e) => setF({ ...f, activeFrom: e.target.value })} className={input} title="Aktif mulai" />
        <input type="datetime-local" value={f.activeUntil} onChange={(e) => setF({ ...f, activeUntil: e.target.value })} className={input} title="Aktif sampai" />
        <button type="submit" disabled={busy || !f.name.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Buat link
        </button>
      </form>
    </section>
  )
}
