'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Loader2, X, Save } from 'lucide-react'
import { slugify } from '@/lib/slug'
import { SERP_TITLE_MAX_PX, SERP_DESC_MAX_PX, truncateByWidth } from '@/lib/serp'

export interface KategoriRow {
  id: number
  slug: string
  nama: string
  deskripsi: string | null
  seoTitle: string | null
  seoDescription: string | null
  urutan: number
  tampil: boolean
  jumlahPost: number
}

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

export function KategoriManager({ kategori }: { kategori: KategoriRow[] }) {
  const router = useRouter()
  const [buka, setBuka] = useState<{ id?: number } | null>(null)
  const [menyimpan, setMenyimpan] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    slug: '',
    deskripsi: '',
    seoTitle: '',
    seoDescription: '',
    tampil: true,
  })
  const [slugSentuh, setSlugSentuh] = useState(false)

  function bukaTambah() {
    setForm({ nama: '', slug: '', deskripsi: '', seoTitle: '', seoDescription: '', tampil: true })
    setSlugSentuh(false)
    setBuka({})
  }

  function bukaEdit(k: KategoriRow) {
    setForm({
      nama: k.nama,
      slug: k.slug,
      deskripsi: k.deskripsi ?? '',
      seoTitle: k.seoTitle ?? '',
      seoDescription: k.seoDescription ?? '',
      tampil: k.tampil,
    })
    setSlugSentuh(true)
    setBuka({ id: k.id })
  }

  async function simpan() {
    setMenyimpan(true)
    try {
      const res = await fetch(buka?.id ? `/api/admin/berita/kategori/${buka.id}` : '/api/admin/berita/kategori', {
        method: buka?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: form.nama,
          slug: form.slug || undefined,
          deskripsi: form.deskripsi || null,
          seoTitle: form.seoTitle || null,
          seoDescription: form.seoDescription || null,
          tampil: form.tampil,
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

  async function ubahTampil(k: KategoriRow) {
    const res = await fetch(`/api/admin/berita/kategori/${k.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tampil: !k.tampil }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.message ?? 'Gagal mengubah')
      return
    }
    toast.success(json.message ?? 'Diperbarui')
    router.refresh()
  }

  async function hapus(k: KategoriRow) {
    if (!confirm(`Hapus kategori "${k.nama}"?`)) return
    const res = await fetch(`/api/admin/berita/kategori/${k.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.message ?? 'Gagal menghapus')
      return
    }
    toast.success(json.message ?? 'Dihapus')
    router.refresh()
  }

  async function geser(k: KategoriRow, arah: -1 | 1) {
    const urutan = [...kategori].sort((a, b) => a.urutan - b.urutan)
    const i = urutan.findIndex((x) => x.id === k.id)
    const j = i + arah
    if (j < 0 || j >= urutan.length) return
    ;[urutan[i], urutan[j]] = [urutan[j], urutan[i]]
    const res = await fetch('/api/admin/berita/kategori/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: urutan.map((x) => x.id) }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.message ?? 'Gagal mengurutkan')
      return
    }
    router.refresh()
  }

  const urut = [...kategori].sort((a, b) => a.urutan - b.urutan)
  const pratinjauJudul = truncateByWidth(form.seoTitle || form.nama || 'Judul kategori', SERP_TITLE_MAX_PX)

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={bukaTambah}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Kategori
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Berita</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Urutan</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Tampil</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {urut.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Belum ada kategori.
                </td>
              </tr>
            )}
            {urut.map((k, i) => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{k.nama}</p>
                  {k.deskripsi && <p className="line-clamp-1 text-xs text-gray-400">{k.deskripsi}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">/berita/kategori/{k.slug}</td>
                <td className="px-4 py-3 text-center tabular-nums text-gray-600">{k.jumlahPost}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" onClick={() => geser(k, -1)} disabled={i === 0} title="Naikkan" className="p-1 text-gray-500 hover:text-brand-primary disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-xs tabular-nums text-gray-500">{i + 1}</span>
                    <button type="button" onClick={() => geser(k, 1)} disabled={i === urut.length - 1} title="Turunkan" className="p-1 text-gray-500 hover:text-brand-primary disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button type="button" onClick={() => ubahTampil(k)} title={k.tampil ? 'Sembunyikan' : 'Tampilkan'}>
                    {k.tampil ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => bukaEdit(k)} title="Sunting" className="p-1.5 text-gray-500 hover:text-brand-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => hapus(k)} title="Hapus" className="p-1.5 text-gray-500 hover:text-red-600">
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
              <h3 className="text-lg font-semibold text-gray-900">
                {buka.id ? 'Sunting Kategori' : 'Tambah Kategori'}
              </h3>
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
                      slug: slugSentuh ? f.slug : slugify(nama, { maxLength: 80, fallback: 'kategori' }),
                    }))
                  }}
                  className={input}
                  placeholder="mis. Ma'had Aly"
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
                <p className="mt-1 text-xs text-gray-500">
                  Dipakai di <span className="font-mono">/berita/kategori/{form.slug || '...'}</span>
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))} rows={3} className={input} />
                <p className="mt-1 text-xs text-gray-500">Ditampilkan di kepala halaman arsip kategori.</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">SEO kategori</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Meta title <span className="text-gray-400">({(form.seoTitle || form.nama).length}/60)</span>
                    </label>
                    <input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} className={input} placeholder={form.nama || 'Judul kategori'} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Meta description <span className="text-gray-400">({form.seoDescription.length}/158)</span>
                    </label>
                    <textarea value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} rows={2} className={input} />
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="truncate text-sm text-blue-700">{pratinjauJudul}</p>
                    <p className="truncate text-xs text-green-700">mahadaly.syathiby.id › Berita › Kategori</p>
                    <p className="line-clamp-2 text-xs text-gray-600">
                      {truncateByWidth(form.seoDescription || form.deskripsi || 'Deskripsi kategori akan tampil di sini.', SERP_DESC_MAX_PX, 14)}
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.tampil}
                  onChange={(e) => setForm((f) => ({ ...f, tampil: e.target.checked }))}
                  className="rounded"
                />
                Tampilkan di situs
              </label>
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
