'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'
import type { BeritaListRow } from '@/lib/berita-admin'

interface Props {
  row: BeritaListRow
  kategori: { id: number; nama: string }[]
  onClose: () => void
}

function toLocalInput(iso: string | Date | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/**
 * Edit cepat satu baris (tanpa membuka halaman editor).
 * Semua field opsional dikirim apa adanya ke PATCH /api/admin/berita/:id.
 */
export function QuickEditRow({ row, kategori, onClose }: Props) {
  const router = useRouter()
  const [menyimpan, setMenyimpan] = useState(false)
  const [judul, setJudul] = useState(row.judul)
  const [slug, setSlug] = useState(row.slug)
  const [ringkasan, setRingkasan] = useState(row.excerpt)
  const [kategoriId, setKategoriId] = useState(row.kategori.id)
  const [status, setStatus] = useState(row.status)
  const [publishedAt, setPublishedAt] = useState(toLocalInput(row.publishedAt))
  const [sticky, setSticky] = useState(row.sticky)
  const [noindex, setNoindex] = useState(row.noindex)
  const [focusKeyword, setFocusKeyword] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  async function simpan() {
    setMenyimpan(true)
    try {
      const res = await fetch(`/api/admin/berita/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          slug: slug || undefined,
          ringkasan: ringkasan || null,
          kategoriId,
          status,
          publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
          sticky,
          noindex,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          focusKeyword: focusKeyword || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menyimpan')
        if (json.errors) {
          const pesan = Object.values(json.errors as Record<string, string[]>).flat()[0]
          if (pesan) toast.error(pesan)
        }
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      onClose()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <tr className="bg-brand-surface/40">
      <td colSpan={9} className="px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Judul</label>
              <input value={judul} onChange={(e) => setJudul(e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Slug URL</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} className={`${input} font-mono`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Ringkasan <span className="text-gray-400">({ringkasan.length}/300)</span>
              </label>
              <textarea value={ringkasan} onChange={(e) => setRingkasan(e.target.value)} rows={2} maxLength={300} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
                <select value={kategoriId} onChange={(e) => setKategoriId(Number(e.target.value))} className={input}>
                  {kategori.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
                  <option value="draft">Draft</option>
                  <option value="published">Terbit</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal terbit</label>
              <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={input} />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={sticky} onChange={(e) => setSticky(e.target.checked)} className="rounded" />
                Sematkan
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="rounded" />
                Jangan diindeks
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">SEO</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kata kunci fokus</label>
              <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Meta title</label>
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Meta description</label>
              <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} className={input} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={simpan}
            disabled={menyimpan}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {menyimpan ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Simpan
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5" /> Batal
          </button>
        </div>
      </td>
    </tr>
  )
}
