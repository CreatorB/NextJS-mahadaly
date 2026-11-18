'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Loader2, RotateCcw, History } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Revisi {
  id: number
  judul: string
  slug: string
  status: string
  note: string | null
  createdAt: string
  createdBy: string | null
}

/** Panel riwayat revisi: daftar snapshot isi artikel + aksi pulihkan. */
export function RevisionDrawer({ postId, onClose }: { postId: number; onClose: () => void }) {
  const router = useRouter()
  const [revisi, setRevisi] = useState<Revisi[] | null>(null)
  const [memuat, setMemuat] = useState(true)
  const [pulihkan, setPulihkan] = useState<number | null>(null)

  useEffect(() => {
    let batal = false
    const muat = async () => {
      try {
        const res = await fetch(`/api/admin/berita/${postId}/revisions`)
        const json = await res.json()
        if (!batal && res.ok && json.success) setRevisi(json.data)
      } catch {
        if (!batal) setRevisi([])
      } finally {
        if (!batal) setMemuat(false)
      }
    }
    void muat()
    return () => {
      batal = true
    }
  }, [postId])

  async function restore(id: number) {
    if (!confirm('Pulihkan artikel ke revisi ini? Isi saat ini disimpan dulu sebagai revisi baru.')) return
    setPulihkan(id)
    try {
      const res = await fetch(`/api/admin/berita/${postId}/revisions/${id}/restore`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal memulihkan')
        return
      }
      toast.success(json.message ?? 'Dipulihkan')
      onClose()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setPulihkan(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <History className="h-5 w-5 text-brand-primary" /> Riwayat revisi
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {memuat && (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
            </p>
          )}
          {!memuat && (revisi?.length ?? 0) === 0 && (
            <p className="text-sm text-gray-500">Belum ada revisi. Revisi tersimpan otomatis setiap kali artikel disunting.</p>
          )}
          <ul className="space-y-3">
            {revisi?.map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-800">{r.judul}</p>
                <p className="mt-0.5 font-mono text-xs text-gray-400">/berita/{r.slug}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {format(new Date(r.createdAt), 'd MMM yyyy HH:mm', { locale: idLocale })}
                  {r.createdBy ? ` · ${r.createdBy}` : ''}
                  {r.note ? ` · ${r.note}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => restore(r.id)}
                  disabled={pulihkan === r.id}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {pulihkan === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Pulihkan
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
