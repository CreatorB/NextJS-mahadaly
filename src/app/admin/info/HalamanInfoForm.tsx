'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { KATEGORI_LIST, KATEGORI_LABEL, slugify } from '@/lib/halaman-info-shared'

export interface HalamanInfoInitial {
  id: number
  slug: string
  judul: string
  kategori: string
  ringkasan: string | null
  konten: string
  urutan: number
  tampil: boolean
}

/**
 * Form admin untuk halaman informasi (info KIAS, panduan, dsb).
 *
 * Isi disimpan sebagai HTML tersanitasi di sisi server, jadi di sini cukup
 * mengirim HTML mentah dari editor WYSIWYG.
 */
export function HalamanInfoForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: HalamanInfoInitial
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [judul, setJudul] = useState(initial?.judul ?? '')
  const [slugSentuh, setSlugSentuh] = useState(mode === 'edit')
  const [slugManual, setSlugManual] = useState(initial?.slug ?? '')
  const [kategori, setKategori] = useState(initial?.kategori ?? KATEGORI_LIST[0])
  const [ringkasan, setRingkasan] = useState(initial?.ringkasan ?? '')
  const [konten, setKonten] = useState(initial?.konten ?? '')
  const [urutan, setUrutan] = useState(String(initial?.urutan ?? 0))
  const [tampil, setTampil] = useState(initial?.tampil ?? true)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Slug mengikuti judul selama admin belum menyuntingnya sendiri (derived, tanpa effect).
  const slug = slugSentuh ? slugManual : slugify(judul)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)

    const payload = {
      judul: judul.trim(),
      slug: slug.trim(),
      kategori,
      ringkasan: ringkasan.trim() ? ringkasan.trim() : null,
      konten,
      urutan: Number(urutan) || 0,
      tampil,
    }

    try {
      const res = await fetch(
        mode === 'create' ? '/api/admin/info' : `/api/admin/info/${initial?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      startTransition(() => {
        router.push('/admin/info')
        router.refresh()
      })
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!initial) return
    const ok = window.confirm(
      `Halaman "${initial.judul}" akan dihapus permanen. Lanjut?`,
    )
    if (!ok) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/info/${initial.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menghapus')
        return
      }
      toast.success(json.message ?? 'Halaman dihapus')
      startTransition(() => {
        router.push('/admin/info')
        router.refresh()
      })
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setDeleting(false)
    }
  }

  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Judul <span className="text-red-500">*</span>
          </label>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            required
            maxLength={191}
            className={input}
          />
          {errors.judul && <p className="mt-1 text-xs text-red-600">{errors.judul[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ringkasan <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <textarea
            value={ringkasan}
            onChange={(e) => setRingkasan(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Teks singkat yang tampil di bawah judul dan di daftar info."
            className={input}
          />
          <p className="mt-1 text-xs text-gray-500">{ringkasan.length}/500 karakter</p>
          {errors.ringkasan && <p className="mt-1 text-xs text-red-600">{errors.ringkasan[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Isi Halaman <span className="text-red-500">*</span>
          </label>
          <div data-editor="konten">
            <RichTextEditor value={konten} onChange={setKonten} allowVideo />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Isi halaman tampil persis seperti dipratinjau. Video YouTube boleh disisipkan lewat
            tombol <span className="font-medium">video</span> pada toolbar.
          </p>
          {errors.konten && <p className="mt-1 text-xs text-red-600">{errors.konten[0]}</p>}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className={input}
            >
              {KATEGORI_LIST.map((k) => (
                <option key={k} value={k}>
                  {KATEGORI_LABEL[k] ?? k}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Kategori <strong>Info KIAS</strong> ditampilkan di halaman program KIAS.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slug URL</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugSentuh(true)
                setSlugManual(e.target.value.toLowerCase())
              }}
              placeholder="otomatis dari judul"
              className={`${input} font-mono`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Alamat halaman: <span className="font-mono">/program/kias/{slug || '...'}</span>
            </p>
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug[0]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label>
            <input
              type="number"
              value={urutan}
              onChange={(e) => setUrutan(e.target.value)}
              min={0}
              max={9999}
              className={input}
            />
            <p className="mt-1 text-xs text-gray-500">Angka kecil tampil lebih dulu.</p>
            {errors.urutan && <p className="mt-1 text-xs text-red-600">{errors.urutan[0]}</p>}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tampil}
              onChange={(e) => setTampil(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Tampilkan di halaman publik
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Link
              href="/admin/info"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
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

          {mode === 'edit' && initial && (
            <>
              <a
                href={`/program/kias/${initial.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" /> Lihat Halaman
              </a>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus Halaman
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
