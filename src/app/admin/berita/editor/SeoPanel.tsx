'use client'
import { Loader2, ImagePlus, Trash2 } from 'lucide-react'
import { SerpPreview } from './SerpPreview'
import { inputClass, labelClass, type PostFormState, type SetForm } from './types'

interface Props {
  form: PostFormState
  set: SetForm
  baseUrl: string
  crumb: string
  deskripsiEfektif: string
  judulEfektif: string
  uploadingOg: boolean
  onOg: (file: File | undefined) => void
  uploadingTwitter: boolean
  onTwitter: (file: File | undefined) => void
  ogUrl: string | null
  twitterUrl: string | null
}

/** Tab "SEO": meta title/description, kata kunci, kanonik, robots, OG/Twitter. */
export function SeoPanel({
  form, set, baseUrl, crumb, deskripsiEfektif, judulEfektif,
  uploadingOg, onOg, uploadingTwitter, onTwitter, ogUrl, twitterUrl,
}: Props) {
  return (
    <div className="space-y-4">
      <SerpPreview judul={judulEfektif} deskripsi={deskripsiEfektif} path={`/berita/${form.slug}`} baseUrl={baseUrl} crumb={crumb} />

      <div>
        <label className={labelClass}>Kata kunci fokus</label>
        <input
          value={form.focusKeyword}
          onChange={(e) => set('focusKeyword', e.target.value)}
          maxLength={100}
          placeholder="mis. kajian tafsir ma'had aly"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Dipakai untuk memeriksa apakah kata kunci muncul di tempat yang tepat.</p>
      </div>

      <div>
        <label className={labelClass}>
          Meta title <span className="text-gray-400">({form.metaTitle.length || judulEfektif.length}/60)</span>
        </label>
        <input
          value={form.metaTitle}
          onChange={(e) => set('metaTitle', e.target.value)}
          maxLength={255}
          placeholder={judulEfektif || 'Judul artikel'}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Kosongkan untuk memakai judul artikel.</p>
      </div>

      <div>
        <label className={labelClass}>
          Meta description <span className="text-gray-400">({form.metaDescription.length || deskripsiEfektif.length}/158)</span>
        </label>
        <textarea
          value={form.metaDescription}
          onChange={(e) => set('metaDescription', e.target.value)}
          maxLength={320}
          rows={3}
          placeholder={deskripsiEfektif || 'Ringkasan singkat isi artikel'}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Kosongkan untuk memakai ringkasan atau 158 karakter pertama isi.</p>
      </div>

      <div>
        <label className={labelClass}>Kata kunci SEO (pisahkan koma)</label>
        <input
          value={form.seoKeywords}
          onChange={(e) => set('seoKeywords', e.target.value)}
          maxLength={255}
          placeholder="kajian tafsir, tahfiz cilacap, ma'had aly"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>URL kanonik</label>
        <input
          value={form.canonicalUrl}
          onChange={(e) => set('canonicalUrl', e.target.value)}
          maxLength={255}
          placeholder={`${baseUrl}/berita/${form.slug || '...'}`}
          className={`${inputClass} font-mono`}
        />
        <p className="mt-1 text-xs text-gray-500">Kosongkan untuk memakai URL artikel ini.</p>
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 p-3">
        <p className="text-sm font-medium text-gray-700">Aturan mesin pencari</p>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.noindex} onChange={(e) => set('noindex', e.target.checked)} className="mt-0.5 rounded" />
          <span>
            Jangan indeks halaman ini
            <span className="block text-xs text-gray-500">Artikel tetap tampil di situs, tapi tidak masuk sitemap, RSS, dan hasil pencarian.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.nofollow} onChange={(e) => set('nofollow', e.target.checked)} className="mt-0.5 rounded" />
          <span>
            Jangan ikuti tautan di halaman ini
            <span className="block text-xs text-gray-500">Mesin pencari tidak ikut menaut ke halaman lain dari artikel ini.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.schemaJsonLd}
            onChange={(e) => set('schemaJsonLd', e.target.checked)}
            className="mt-0.5 rounded"
          />
          <span>
            Tampilkan data terstruktur (schema.org)
            <span className="block text-xs text-gray-500">BlogPosting &amp; BreadcrumbList untuk kaya akan hasil pencarian.</span>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Gambar OG (share)</label>
          {ogUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ogUrl} alt="" className="aspect-video w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => set('ogImage', null)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                title="Hapus gambar OG"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-primary">
              {uploadingOg ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              Pilih gambar OG
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onOg(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div>
          <label className={labelClass}>Gambar Twitter</label>
          {twitterUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={twitterUrl} alt="" className="aspect-video w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => set('twitterImage', null)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                title="Hapus gambar Twitter"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-primary">
              {uploadingTwitter ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              Pilih gambar Twitter
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onTwitter(e.target.files?.[0])} />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
