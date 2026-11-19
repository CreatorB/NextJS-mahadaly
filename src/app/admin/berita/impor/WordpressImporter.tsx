'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Download, Check, Square, CheckSquare, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface WpPost {
  id: number
  slug: string
  judul: string
  tanggal: string
  excerpt: string
  kategori: { id: number; name: string; slug: string }[]
  tag: { id: number; name: string; slug: string }[]
  coverUrl: string | null
  sudahDiimpor: boolean
}

interface Props {
  kategori: { id: number; nama: string }[]
  sumber: string
}

const input =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

export function WordpressImporter({ kategori, sumber }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState<WpPost[] | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [memuat, setMemuat] = useState(true)
  const [terpilih, setTerpilih] = useState<number[]>([])
  const [kategoriId, setKategoriId] = useState(kategori[0]?.id ?? 0)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [importTag, setImportTag] = useState(false)
  const [cumaBelum, setCumaBelum] = useState(true)
  const [mProses, setProses] = useState(false)
  const [hasil, setHasil] = useState<{ judul: string; pesan: string; id?: number }[] | null>(null)

  const muat = async () => {
    setMemuat(true)
    setGalat(null)
    try {
      const res = await fetch('/api/admin/berita/impor')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setGalat(json.message ?? 'Gagal mengambil daftar artikel WordPress.')
        setPosts([])
        return
      }
      setPosts(json.data.posts)
    } catch {
      setGalat('Gagal menghubungi server.')
      setPosts([])
    } finally {
      setMemuat(false)
    }
  }

  // Muat di luar effect body (setTimeout) supaya setState tidak jalan sinkron
  // di dalam effect — React 19 menandainya sebagai cascading render.
  useEffect(() => {
    const t = setTimeout(() => {
      void muat()
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const tampil = useMemo(
    () => (posts ?? []).filter((p) => (cumaBelum ? !p.sudahDiimpor : true)),
    [posts, cumaBelum],
  )

  const semuaTerpilih = tampil.length > 0 && tampil.every((p) => terpilih.includes(p.id))

  const toggle = (id: number) =>
    setTerpilih((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  const toggleSemua = () =>
    setTerpilih(semuaTerpilih ? [] : tampil.filter((p) => !p.sudahDiimpor).map((p) => p.id))

  async function impor() {
    if (!terpilih.length) {
      toast.error('Pilih minimal satu artikel.')
      return
    }
    setProses(true)
    setHasil(null)
    try {
      const res = await fetch('/api/admin/berita/impor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: terpilih, kategoriId, status, importTag }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Impor gagal')
        return
      }
      toast.success(json.message ?? 'Impor selesai')
      setHasil(json.data.hasil)
      setTerpilih([])
      await muat()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Sumber:{' '}
          <a href={sumber} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-primary hover:underline">
            {sumber} <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {posts && <> · {posts.length} artikel ditemukan</>}
        </p>
        <button
          type="button"
          onClick={() => void muat()}
          disabled={memuat}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={clsx('h-4 w-4', memuat && 'animate-spin')} /> Muat ulang
        </button>
      </div>

      {galat && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {galat}
            <span className="mt-1 block text-xs">
              Pengambilan artikel WordPress dilakukan dari server (syathiby.id memakai challenge Cloudflare untuk
              klien biasa).
            </span>
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Kategori tujuan</label>
          <select value={kategoriId} onChange={(e) => setKategoriId(Number(e.target.value))} className={input}>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Status setelah impor</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className={input}>
            <option value="draft">Draft (periksa dulu)</option>
            <option value="published">Terbit</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={importTag} onChange={(e) => setImportTag(e.target.checked)} className="rounded" />
          Impor tag WordPress
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={cumaBelum} onChange={(e) => setCumaBelum(e.target.checked)} className="rounded" />
          Tampilkan yang belum diimpor saja
        </label>
        <button
          type="button"
          onClick={() => void impor()}
          disabled={mProses || terpilih.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {mProses ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Impor {terpilih.length > 0 ? `${terpilih.length} artikel` : 'artikel'}
        </button>
      </div>

      {hasil && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-gray-800">Hasil impor</p>
          <ul className="space-y-1 text-sm">
            {hasil.map((h, i) => (
              <li key={i} className="flex items-center gap-2">
                {h.id ? (
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                )}
                <span className="truncate text-gray-700">{h.judul}</span>
                <span className="text-xs text-gray-400">{h.pesan}</span>
                {h.id && (
                  <Link href={`/admin/berita/${h.id}`} className="ml-auto text-xs text-brand-primary hover:underline">
                    Buka
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              <th className="w-10 px-4 py-3">
                <button type="button" onClick={toggleSemua} aria-label="Pilih semua">
                  {semuaTerpilih ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4 text-gray-400" />}
                </button>
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Judul (WordPress)</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Kategori WP</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Tag WP</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Sampul</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {memuat && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengambil artikel dari WordPress…
                  </span>
                </td>
              </tr>
            )}
            {!memuat && tampil.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  {posts?.length ? 'Semua artikel sudah diimpor.' : 'Tidak ada artikel untuk ditampilkan.'}
                </td>
              </tr>
            )}
            {tampil.map((p) => (
              <tr key={p.id} className={clsx('hover:bg-gray-50', p.sudahDiimpor && 'opacity-60')}>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    disabled={p.sudahDiimpor}
                    aria-label={`Pilih ${p.judul}`}
                  >
                    {terpilih.includes(p.id) ? (
                      <CheckSquare className="h-4 w-4 text-brand-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-gray-800">{p.judul}</p>
                  <p className="font-mono text-xs text-gray-400">/{p.slug}</p>
                  {p.excerpt && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.excerpt}</p>}
                </td>
                <td className="px-3 py-3 text-gray-600">
                  {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </td>
                <td className="px-3 py-3 text-gray-600">{p.kategori.map((k) => k.name).join(', ') || '-'}</td>
                <td className="px-3 py-3 text-xs text-gray-500">
                  {p.tag.length ? `${p.tag.length} tag` : '-'}
                  {p.tag.length > 0 && <span className="block truncate text-gray-400">{p.tag.slice(0, 3).map((t) => t.name).join(', ')}</span>}
                </td>
                <td className="px-3 py-3">
                  {p.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverUrl} alt="" loading="lazy" className="h-11 w-16 rounded object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {p.sudahDiimpor ? (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">Sudah ada</span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Baru</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
