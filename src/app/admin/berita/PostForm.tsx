'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor, uploadBeritaImage } from '@/components/admin/RichTextEditor'

interface Kategori { id: number; nama: string }

interface InitialData {
  id?: number
  judul?: string
  slug?: string
  ringkasan?: string | null
  konten?: string
  coverImage?: string | null
  coverUrl?: string | null
  status?: 'draft' | 'published'
  publishedAt?: string | null
  kategoriId?: number
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function PostForm({ mode, kategori, initial }: { mode: 'create' | 'edit'; kategori: Kategori[]; initial?: InitialData }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [judul, setJudul] = useState(initial?.judul ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [ringkasan, setRingkasan] = useState(initial?.ringkasan ?? '')
  const [konten, setKonten] = useState(initial?.konten ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? null)
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? null)
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status ?? 'draft')
  const [publishedAt, setPublishedAt] = useState(toLocalInput(initial?.publishedAt))
  const [kategoriId, setKategoriId] = useState(initial?.kategoriId ?? kategori[0]?.id ?? 0)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const onCover = async (file: File | undefined) => {
    if (!file) return
    setUploadingCover(true)
    try {
      const { path, url } = await uploadBeritaImage(file)
      setCoverImage(path)
      setCoverUrl(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload gagal')
    } finally {
      setUploadingCover(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    const payload = {
      judul,
      slug: slug || undefined,
      ringkasan: ringkasan || null,
      konten,
      coverImage,
      status,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      kategoriId,
    }
    try {
      const res = await fetch(mode === 'create' ? '/api/admin/berita' : `/api/admin/berita/${initial?.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      startTransition(() => {
        router.push('/admin/berita')
        router.refresh()
      })
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Judul <span className="text-red-500">*</span></label>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} required maxLength={200} className={input} />
          {errors.judul && <p className="mt-1 text-xs text-red-600">{errors.judul[0]}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ringkasan</label>
          <textarea
            value={ringkasan}
            onChange={(e) => setRingkasan(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Opsional — tampil di kartu berita. Kosongkan untuk diambil otomatis dari isi."
            className={input}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Isi Berita <span className="text-red-500">*</span></label>
          <RichTextEditor value={konten} onChange={setKonten} />
          {errors.konten && <p className="mt-1 text-xs text-red-600">{errors.konten[0]}</p>}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
            <select value={kategoriId} onChange={(e) => setKategoriId(Number(e.target.value))} className={input}>
              {kategori.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className={input}>
              <option value="draft">Draft</option>
              <option value="published">Terbit</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal terbit</label>
            <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={input} />
            <p className="mt-1 text-xs text-gray-500">Kosong = saat diterbitkan. Tanggal ke depan = terbit terjadwal.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slug URL</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="otomatis dari judul"
              className={`${input} font-mono`}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug[0]}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">Gambar sampul</label>
          {coverUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="Sampul" className="aspect-video w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => { setCoverImage(null); setCoverUrl(null) }}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                title="Hapus sampul"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-primary">
              {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              Pilih gambar (maks 3 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => onCover(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/admin/berita" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </button>
        </div>
      </div>
    </form>
  )
}
