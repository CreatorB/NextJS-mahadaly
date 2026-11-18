'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, X, Save, Tag as TagIcon } from 'lucide-react'
import { slugify } from '@/lib/slug'

export interface TagRow {
  id: number
  slug: string
  nama: string
  deskripsi: string | null
  seoTitle: string | null
  seoDescription: string | null
  jumlahPost: number
}

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

export function TagManager({ tag }: { tag: TagRow[] }) {
  const router = useRouter()
  const [buka, setBuka] = useState<{ id?: number } | null>(null)
  const [menyimpan, setMenyimpan] = useState(false)
  const [form, setForm] = useState({ nama: '', slug: '', deskripsi: '', seoTitle: '', seoDescription: '' })
  const [slugSentuh, setSlugSentuh] = useState(false)

  function bukaTambah() {
    setForm({ nama: '', slug: '', deskripsi: '', seoTitle: '', seoDescription: '' })
    setSlugSentuh(false)
    setBuka({})
  }

  function bukaEdit(t: TagRow) {
    setForm({
      nama: t.nama,
      slug: t.slug,
      deskripsi: t.deskripsi ?? '',
      seoTitle: t.seoTitle ?? '',
      seoDescription: t.seoDescription ?? '',
    })
    setSlugSentuh(true)
    setBuka({ id: t.id })
  }

  async function simpan() {
    setMenyimpan(true)
    try {
      const res = await fetch(buka?.id ? `/api/admin/berita/tag/${buka.id}` : '/api/admin/berita/tag', {
        method: buka?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: form.nama,
          slug: form.slug || undefined,
          deskripsi: form.deskripsi || null,
          seoTitle: form.seoTitle || null,
          seoDescription: form.seoDescription || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      setBuka(null)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMenyimpan(false)
    }
  }

  async function hapus(t: TagRow) {
    if (!confirm(`Hapus tag "${t.nama}"? Tag akan dilepas dari ${t.jumlahPost} berita.`)) return
    const res = await fetch(`/api/admin/berita/tag/${t.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.message ?? 'Gagal menghapus')
      return
    }
    toast.success(json.message ?? 'Dihapus')
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={bukaTambah}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Tag
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Berita</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tag.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  <TagIcon className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                  Belum ada tag. Tag bisa dibuat dari panel editor artikel.
                </td>
              </tr>
            )}
            {tag.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{t.nama}</p>
                  {t.deskripsi && <p className="line-clamp-1 text-xs text-gray-400">{t.deskripsi}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">/berita/tag/{t.slug}</td>
                <td className="px-4 py-3 text-center tabular-nums text-gray-600">{t.jumlahPost}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => bukaEdit(t)} title="Sunting" className="p-1.5 text-gray-500 hover:text-brand-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => hapus(t)} title="Hapus" className="p-1.5 text-gray-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {buka && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-900">{buka.id ? 'Sunting Tag' : 'Tambah Tag'}</h3>
              <button type="button" onClick={() => setBuka(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama <span className="text-red-500">*</span></label>
                <input
                  value={form.nama}
                  onChange={(e) => {
                    const nama = e.target.value
                    setForm((f) => ({
                      ...f,
                      nama,
                      slug: slugSentuh ? f.slug : slugify(nama, { maxLength: 80, fallback: 'tag' }),
                    }))
                  }}
                  className={input}
                  placeholder="mis. Kajian Tafsir"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug URL</label>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugSentuh(true)
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
                  }}
                  className={`${input} font-mono`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))} rows={3} className={input} />
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">SEO tag</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Meta title</label>
                    <input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} className={input} placeholder={form.nama || 'Judul tag'} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Meta description</label>
                    <textarea value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} rows={2} className={input} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 p-5">
              <button type="button" onClick={() => setBuka(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button
                type="button"
                onClick={simpan}
                disabled={menyimpan || form.nama.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {menyimpan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
