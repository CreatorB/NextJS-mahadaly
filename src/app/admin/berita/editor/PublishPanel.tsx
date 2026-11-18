'use client'
import { useRef } from 'react'
import { Loader2, ImagePlus, Trash2, Wand2 } from 'lucide-react'
import { TagInput } from './TagInput'
import { inputClass, labelClass, type KategoriOpsi, type PenulisOpsi, type PostFormState, type SetForm, type TagOpsi } from './types'

interface Props {
  form: PostFormState
  set: SetForm
  kategori: KategoriOpsi[]
  tags: TagOpsi[]
  authors: PenulisOpsi[]
  coverUrl: string | null
  onCover: (file: File | undefined) => void
  uploadingCover: boolean
  onAmbilRingkasan: () => void
}

/** Tab "Publikasi": status, jadwal tayang, kategori, tag, penulis, sampul. */
export function PublishPanel({
  form, set, kategori, tags, authors, coverUrl, onCover, uploadingCover, onAmbilRingkasan,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Status</label>
        <select value={form.status} onChange={(e) => set('status', e.target.value as 'draft' | 'published')} className={inputClass}>
          <option value="draft">Draft — belum tayang</option>
          <option value="published">Terbit</option>
        </select>
      </div>

      {form.status === 'published' && (
        <div>
          <label className={labelClass}>Tanggal terbit</label>
          <input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(e) => set('publishedAt', e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">
            {form.publishedAt
              ? `Akan tayang pada ${new Date(form.publishedAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`
              : 'Kosong = langsung terbit begitu disimpan.'}
          </p>
        </div>
      )}

      <div>
        <label className={labelClass}>Kategori</label>
        <select value={form.kategoriId} onChange={(e) => set('kategoriId', Number(e.target.value))} className={inputClass}>
          {kategori.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
              {k.tampil ? '' : ' (disembunyikan di situs)'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Tag</label>
        <TagInput value={form.tagSlugs} onChange={(v) => set('tagSlugs', v)} suggestions={tags} />
      </div>

      <div>
        <label className={labelClass}>Penulis</label>
        <select
          value={form.authorId ?? ''}
          onChange={(e) => set('authorId', e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        >
          <option value="">— Tanpa penulis —</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>{a.nama}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>
          Ringkasan <span className="text-gray-400">({form.ringkasan.length}/300)</span>
        </label>
        <textarea
          value={form.ringkasan}
          onChange={(e) => set('ringkasan', e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Tampil di kartu berita & jadi meta description bawaan."
          className={inputClass}
        />
        <button
          type="button"
          onClick={onAmbilRingkasan}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-brand-secondary hover:underline"
        >
          <Wand2 className="h-3.5 w-3.5" /> Ambil otomatis dari isi artikel
        </button>
      </div>

      <div>
        <label className={labelClass}>Gambar sampul</label>
        {coverUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="Sampul" className="aspect-video w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => {
                set('coverImage', null)
                set('coverAlt', '')
              }}
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
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              ref={fileRef}
              onChange={(e) => onCover(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {form.coverImage && (
        <div>
          <label className={labelClass}>Teks alternatif gambar (alt)</label>
          <input
            value={form.coverAlt}
            onChange={(e) => set('coverAlt', e.target.value)}
            maxLength={255}
            placeholder="Deskripsi singkat gambar — dibaca pembaca layar & mesin pencari"
            className={inputClass}
          />
        </div>
      )}
    </div>
  )
}
