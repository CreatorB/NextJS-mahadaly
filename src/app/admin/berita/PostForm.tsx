'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Eye, Copy, History, FileEdit, Check } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { computeSeoScore, stripHtml } from '@/lib/seo-score'
import { PublishPanel } from './editor/PublishPanel'
import { SeoPanel } from './editor/SeoPanel'
import { AdvancedPanel } from './editor/AdvancedPanel'
import { SeoScorePanel } from './editor/SeoScorePanel'
import { PermalinkField } from './editor/PermalinkField'
import { RevisionDrawer } from './editor/RevisionDrawer'
import { inputClass, labelClass, type KategoriOpsi, type PenulisOpsi, type PostFormState, type TagOpsi } from './editor/types'

interface InitialData {
  id?: number
  judul?: string
  slug?: string
  ringkasan?: string | null
  konten?: string
  coverImage?: string | null
  coverUrl?: string | null
  coverAlt?: string | null
  status?: 'draft' | 'published'
  publishedAt?: string | null
  kategoriId?: number
  tagSlugs?: string[]
  authorId?: number | null
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  seoKeywords?: string | null
  canonicalUrl?: string | null
  noindex?: boolean
  nofollow?: boolean
  ogImage?: string | null
  twitterImage?: string | null
  schemaJsonLd?: boolean
  sticky?: boolean
  dibuat?: string
  diubah?: string
}

interface Props {
  mode: 'create' | 'edit'
  kategori: KategoriOpsi[]
  tags: TagOpsi[]
  authors: PenulisOpsi[]
  initial?: InitialData
  baseUrl: string
}

type TabKey = 'publikasi' | 'seo' | 'lanjutan'

function toLocalInput(iso: string | Date | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function PostForm({ mode, kategori, tags, authors, initial, baseUrl }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('publikasi')
  const [menyimpan, setMenyimpan] = useState(false)
  const [ganti, setGanti] = useState(false)
  const [mengganti, setMengganti] = useState(false)
  const [slugSentuh, setSlugSentuh] = useState(Boolean(initial?.slug))
  const [bukaRiwayat, setBukaRiwayat] = useState(false)
  const [terakhirSimpan, setTerakhirSimpan] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingOg, setUploadingOg] = useState(false)
  const [uploadingTwitter, setUploadingTwitter] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null)
  const [ogUrl, setOgUrl] = useState<string | null>(null)
  const [twitterUrl, setTwitterUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const [form, setForm] = useState<PostFormState>({
    judul: initial?.judul ?? '',
    slug: initial?.slug ?? '',
    ringkasan: initial?.ringkasan ?? '',
    konten: initial?.konten ?? '',
    coverImage: initial?.coverImage ?? null,
    coverAlt: initial?.coverAlt ?? '',
    status: initial?.status ?? 'draft',
    publishedAt: toLocalInput(initial?.publishedAt),
    kategoriId: initial?.kategoriId ?? kategori[0]?.id ?? 0,
    tagSlugs: initial?.tagSlugs ?? [],
    authorId: initial?.authorId ?? null,
    metaTitle: initial?.metaTitle ?? '',
    metaDescription: initial?.metaDescription ?? '',
    focusKeyword: initial?.focusKeyword ?? '',
    seoKeywords: initial?.seoKeywords ?? '',
    canonicalUrl: initial?.canonicalUrl ?? '',
    noindex: initial?.noindex ?? false,
    nofollow: initial?.nofollow ?? false,
    ogImage: initial?.ogImage ?? null,
    twitterImage: initial?.twitterImage ?? null,
    schemaJsonLd: initial?.schemaJsonLd ?? true,
    sticky: initial?.sticky ?? false,
  })

  const set = useCallback(<K extends keyof PostFormState>(key: K, value: PostFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setGanti(true)
  }, [])

  // Tandai ada perubahan saat menyunting lewat editor (onChange tidak selalu
  // melewati setter di atas karena RichTextEditor menerima value+onChange).
  const onKonten = useCallback(
    (v: string) => {
      setForm((f) => ({ ...f, konten: v }))
      setGanti(true)
    },
    [],
  )

  const deskripsiEfektif = useMemo(
    () => form.metaDescription.trim() || form.ringkasan.trim() || stripHtml(form.konten).slice(0, 158),
    [form.metaDescription, form.ringkasan, form.konten],
  )
  const judulEfektif = form.metaTitle.trim() || form.judul

  const hasilSeo = useMemo(
    () =>
      computeSeoScore({
        judul: form.judul,
        ringkasan: form.ringkasan,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        focusKeyword: form.focusKeyword,
        slug: form.slug,
        konten: form.konten,
        coverAlt: form.coverAlt,
        baseHost: baseUrl.replace(/^https?:\/\//, ''),
      }),
    [form, baseUrl],
  )

  const crumb = kategori.find((k) => k.id === form.kategoriId)?.nama ?? 'Berita'

  async function unggah(file: File | undefined) {
    if (!file) return null
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/berita/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message ?? 'Upload gagal')
      return json.data as { path: string; url: string }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload gagal')
      return null
    }
  }

  async function onCover(file: File | undefined) {
    setUploadingCover(true)
    try {
      const hasil = await unggah(file)
      if (hasil) {
        set('coverImage', hasil.path)
        setCoverUrl(hasil.url)
        if (!form.coverAlt) set('coverAlt', form.judul)
      }
    } finally {
      setUploadingCover(false)
    }
  }

  async function onOg(file: File | undefined) {
    setUploadingOg(true)
    try {
      const hasil = await unggah(file)
      if (hasil) {
        set('ogImage', hasil.path)
        setOgUrl(hasil.url)
      }
    } finally {
      setUploadingOg(false)
    }
  }

  async function onTwitter(file: File | undefined) {
    setUploadingTwitter(true)
    try {
      const hasil = await unggah(file)
      if (hasil) {
        set('twitterImage', hasil.path)
        setTwitterUrl(hasil.url)
      }
    } finally {
      setUploadingTwitter(false)
    }
  }

  function ambilRingkasan() {
    const teks = stripHtml(form.konten)
    if (!teks) {
      toast.error('Isi artikel masih kosong.')
      return
    }
    const potong = teks.slice(0, 200)
    const batas = potong.lastIndexOf(' ')
    set('ringkasan', (batas > 120 ? potong.slice(0, batas) : potong).trim())
  }

  function payload() {
    return {
      judul: form.judul,
      slug: form.slug || undefined,
      ringkasan: form.ringkasan || null,
      konten: form.konten,
      coverImage: form.coverImage,
      coverAlt: form.coverAlt || null,
      status: form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      kategoriId: form.kategoriId,
      tagSlugs: form.tagSlugs,
      authorId: form.authorId,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      focusKeyword: form.focusKeyword || null,
      seoKeywords: form.seoKeywords || null,
      canonicalUrl: form.canonicalUrl || null,
      noindex: form.noindex,
      nofollow: form.nofollow,
      ogImage: form.ogImage,
      twitterImage: form.twitterImage,
      schemaJsonLd: form.schemaJsonLd,
      sticky: form.sticky,
    }
  }

  async function simpan(paksaDraft = false) {
    if (!form.judul.trim() || form.judul.trim().length < 3) {
      toast.error('Judul minimal 3 karakter.')
      return
    }
    if (!form.konten.trim()) {
      toast.error('Isi artikel wajib diisi.')
      return
    }
    setMenyimpan(true)
    setErrors({})
    const body = { ...payload(), ...(paksaDraft ? { status: 'draft' as const } : {}) }
    try {
      const res = await fetch(
        mode === 'create' ? '/api/admin/berita' : `/api/admin/berita/${initial?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal menyimpan')
        const pertama = Object.values((json.errors ?? {}) as Record<string, string[]>).flat()[0]
        if (pertama) toast.error(pertama)
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      setGanti(false)
      setTerakhirSimpan(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
      if (mode === 'create') {
        router.push(`/admin/berita/${json.data.id}`)
        router.refresh()
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMenyimpan(false)
    }
  }

  async function simpanOtomatis() {
    if (!initial?.id || !ganti) return
    try {
      const res = await fetch(`/api/admin/berita/${initial.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: form.judul,
          ringkasan: form.ringkasan || null,
          konten: form.konten,
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
          focusKeyword: form.focusKeyword || null,
          seoKeywords: form.seoKeywords || null,
          canonicalUrl: form.canonicalUrl || null,
          coverImage: form.coverImage,
          coverAlt: form.coverAlt || null,
        }),
      })
      if (res.ok) {
        setGanti(false)
        setTerakhirSimpan(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch {
      // Autosave gagal diam-diam — pengguna tetap bisa menyimpan manual.
    }
  }

  // Simpan otomatis 30 detik setelah perubahan terakhir.
  useEffect(() => {
    if (mode !== 'edit' || !ganti) return
    const t = setTimeout(() => void simpanOtomatis(), 30_000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ganti, mode, form.judul, form.konten, form.ringkasan])

  // Peringatan saat meninggalkan halaman dengan perubahan belum disimpan.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (ganti) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [ganti])

  async function duplikat() {
    if (!initial?.id) return
    setMengganti(true)
    try {
      const res = await fetch(`/api/admin/berita/${initial.id}/duplicate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menyalin')
        return
      }
      toast.success(json.message ?? 'Tersalin')
      router.push(`/admin/berita/${json.data.id}`)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMengganti(false)
    }
  }

  const tabBtn = (aktif: boolean) =>
    `px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${
      aktif ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="space-y-5">
      {/* Bilah atas */}
      <div className="sticky top-0 z-20 -mx-6 -mt-2 border-b border-gray-100 bg-white/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/berita"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>

          <button
            type="button"
            onClick={() => void simpan()}
            disabled={menyimpan}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {menyimpan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
          </button>

          <button
            type="button"
            onClick={() => void simpan(true)}
            disabled={menyimpan}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <FileEdit className="h-4 w-4" /> Simpan Draft
          </button>

          {initial?.id && (
            <>
              <a
                href={`/preview/berita/${initial.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" /> Pratinjau
              </a>
              <button
                type="button"
                onClick={() => void duplikat()}
                disabled={mengganti}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {mengganti ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Duplikat
              </button>
              <button
                type="button"
                onClick={() => setBukaRiwayat(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <History className="h-4 w-4" /> Riwayat
              </button>
            </>
          )}

          <span className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            {ganti ? (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Belum disimpan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Check className="h-3.5 w-3.5" /> {terakhirSimpan ? `Tersimpan ${terakhirSimpan}` : 'Tersimpan'}
              </span>
            )}
            <span className="rounded-full bg-brand-surface px-2.5 py-1 font-semibold text-brand-primary">
              SEO {hasilSeo.score}/100
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <label className={labelClass}>
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              value={form.judul}
              onChange={(e) => set('judul', e.target.value)}
              required
              maxLength={200}
              className={`${inputClass} text-base font-medium`}
              placeholder="Judul artikel yang jelas & mudah dicari"
            />
            {errors.judul && <p className="mt-1 text-xs text-red-600">{errors.judul[0]}</p>}
          </div>

          <PermalinkField
            judul={form.judul}
            slug={form.slug}
            onSlugChange={(s) => setForm((f) => ({ ...f, slug: s }))}
            slugSentuh={slugSentuh}
            onSlugSentuh={setSlugSentuh}
            baseUrl={baseUrl}
            postId={initial?.id}
          />

          <div>
            <label className={labelClass}>
              Isi Berita <span className="text-red-500">*</span>
            </label>
            <RichTextEditor value={form.konten} onChange={onKonten} />
            {errors.konten && <p className="mt-1 text-xs text-red-600">{errors.konten[0]}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {hasilSeo.words.toLocaleString('id-ID')} kata · sekitar {hasilSeo.readingMinutes} menit baca
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex border-b border-gray-200">
              <button type="button" onClick={() => setTab('publikasi')} className={tabBtn(tab === 'publikasi')}>
                Publikasi
              </button>
              <button type="button" onClick={() => setTab('seo')} className={tabBtn(tab === 'seo')}>
                SEO
              </button>
              <button type="button" onClick={() => setTab('lanjutan')} className={tabBtn(tab === 'lanjutan')}>
                Lanjutan
              </button>
            </div>

            <div className="p-5">
              {tab === 'publikasi' && (
                <PublishPanel
                  form={form}
                  set={set}
                  kategori={kategori}
                  tags={tags}
                  authors={authors}
                  coverUrl={coverUrl}
                  onCover={onCover}
                  uploadingCover={uploadingCover}
                  onAmbilRingkasan={ambilRingkasan}
                />
              )}
              {tab === 'seo' && (
                <SeoPanel
                  form={form}
                  set={set}
                  baseUrl={baseUrl}
                  crumb={crumb}
                  judulEfektif={judulEfektif}
                  deskripsiEfektif={deskripsiEfektif}
                  uploadingOg={uploadingOg}
                  onOg={onOg}
                  uploadingTwitter={uploadingTwitter}
                  onTwitter={onTwitter}
                  ogUrl={ogUrl}
                  twitterUrl={twitterUrl}
                />
              )}
              {tab === 'lanjutan' && (
                <AdvancedPanel
                  form={form}
                  set={set}
                  dibuat={initial?.dibuat ?? '—'}
                  diubah={initial?.diubah ?? '—'}
                  postId={initial?.id}
                />
              )}
            </div>
          </div>

          {tab === 'seo' && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Pemeriksaan SEO</h3>
              <SeoScorePanel hasil={hasilSeo} />
            </div>
          )}
        </div>
      </div>

      {bukaRiwayat && initial?.id && (
        <RevisionDrawer postId={initial.id} onClose={() => setBukaRiwayat(false)} />
      )}
    </div>
  )
}
