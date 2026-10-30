'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Video, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { youtubeEmbedUrl, youtubeThumbnail } from '@/lib/youtube'

interface InitialData {
  konten: string
  videoUrl: string | null
  updatedAt: string | null
}

export function ProfilForm({ initial }: { initial: InitialData }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [konten, setKonten] = useState(initial.konten)
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl ?? '')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt)

  const thumb = youtubeThumbnail(videoUrl)
  const embed = youtubeEmbedUrl(videoUrl)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ konten, videoUrl: videoUrl.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      setSavedAt(new Date().toISOString())
      toast.success(json.message ?? 'Profil tersimpan')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  const previewHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#334155;line-height:1.8;padding:16px;margin:0;font-size:15px}
    h2{color:#00367c;margin-top:1.5rem}h3{color:#0f172a}img{max-width:100%;height:auto;border-radius:.75rem}
    iframe{width:100%;aspect-ratio:16/9;height:auto;border:0;border-radius:.75rem}
    a{color:#00709f}ul{list-style:disc;padding-left:1.5rem}ol{list-style:decimal;padding-left:1.5rem}
    blockquote{border-left:4px solid #35a2c9;padding-left:1rem;font-style:italic}
  </style></head><body>${konten}</body></html>`

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Isi Halaman Profil <span className="text-red-500">*</span>
          </label>
          <RichTextEditor value={konten} onChange={setKonten} allowVideo />
          <p className="mt-1 text-xs text-gray-500">
            Tombol <span className="font-medium">video</span> pada toolbar menyisipkan video YouTube
            langsung di dalam isi. Hanya video YouTube yang diizinkan demi keamanan.
          </p>
          {errors.konten && <p className="mt-1 text-xs text-red-600">{errors.konten[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Video Utama (YouTube)</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtu.be/dwqXJ3kg7bs"
            className={input}
          />
          <p className="mt-1 text-xs text-gray-500">
            Tautan watch / youtu.be / shorts / embed. Video ini tampil di bagian atas halaman profil
            (bukan di dalam isi). Kosongkan untuk menyembunyikannya.
          </p>
          {errors.videoUrl && <p className="mt-1 text-xs text-red-600">{errors.videoUrl[0]}</p>}
        </div>

        {embed && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Pratinjau Video</label>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-black">
              <iframe
                src={embed}
                title="Pratinjau video profil"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Pratinjau Isi Halaman</h2>
          <iframe
            title="Pratinjau isi profil"
            sandbox=""
            srcDoc={previewHtml}
            className="h-96 w-full rounded-lg border border-gray-200 bg-white"
          />
          <p className="text-xs text-gray-500">
            Pratinjau sandbox (tanpa script). Tampilan final mengikuti tema website.
          </p>
        </div>

        {thumb && (
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Thumbnail Video</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="Thumbnail video" className="w-full rounded-lg" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Profil
          </button>

          {savedAt && (
            <p className="flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Terakhir disimpan: {new Date(savedAt).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Penyuntingan akan langsung tampil di halaman publik <span className="font-mono">/profil</span>{' '}
              begitu tersimpan.
            </span>
          </p>
          <p className="mt-2 flex items-start gap-2">
            <Video className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Video YouTube dimuat langsung dari YouTube (embed), sehingga memerlukan koneksi internet
              saat pengunjung membuka halaman.
            </span>
          </p>
        </div>
      </div>
    </form>
  )
}
