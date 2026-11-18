'use client'
import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { CheckSquare, Square, Newspaper, Pencil, ExternalLink, Copy, Pin, EyeOff, Tag } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import type { BeritaListRow, BeritaFacets } from '@/lib/berita-admin'
import { StatusBadge } from './StatusBadge'
import { SeoScoreBadge } from './SeoScoreBadge'
import { BulkActionBar } from './BulkActionBar'
import { QuickEditRow } from './QuickEditRow'
import { DeletePostButton } from './DeletePostButton'

interface Props {
  rows: BeritaListRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
  facets: BeritaFacets
  query: Record<string, string | undefined>
}

export function BeritaManager({ rows, total, page, perPage, totalPages, facets, query }: Props) {
  const router = useRouter()
  const [terpilih, setTerpilih] = useState<number[]>([])
  const [editId, setEditId] = useState<number | null>(null)

  const semuaTerpilih = rows.length > 0 && rows.every((r) => terpilih.includes(r.id))
  const kategoriOpsi = useMemo(() => facets.kategori.map((k) => ({ id: k.id, nama: k.nama })), [facets])

  const toggleSatu = (id: number) =>
    setTerpilih((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  const toggleSemua = () =>
    setTerpilih(semuaTerpilih ? [] : rows.map((r) => r.id))

  async function salin(id: number) {
    const res = await fetch(`/api/admin/berita/${id}/duplicate`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.message ?? 'Gagal menyalin')
      return
    }
    toast.success(json.message ?? 'Tersalin')
    router.refresh()
  }

  const qs = (perubahan: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...query, ...perubahan })) {
      if (v === undefined || v === '') continue
      p.set(k, v)
    }
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  const dari = (page - 1) * perPage + 1
  const sampai = Math.min(total, page * perPage)

  return (
    <div className="space-y-4">
      <BulkActionBar terpilih={terpilih} facets={facets} onClear={() => setTerpilih([])} />

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              <th className="w-10 px-4 py-3">
                <button type="button" onClick={toggleSemua} aria-label="Pilih semua di halaman ini" title="Pilih semua di halaman ini">
                  {semuaTerpilih ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4 text-gray-400" />}
                </button>
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Sampul</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Judul</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Kategori</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Penulis</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700">SEO</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700">Dilihat</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  Tidak ada berita yang cocok dengan filter ini.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <Fragment key={p.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleSatu(p.id)} aria-label={`Pilih ${p.judul}`}>
                      {terpilih.includes(p.id) ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    {p.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverUrl} alt="" className="h-11 w-16 rounded object-cover" />
                    ) : (
                      <div className="flex h-11 w-16 items-center justify-center rounded bg-brand-surface text-gray-300">
                        <Newspaper className="h-5 w-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/berita/${p.id}`} className="font-medium text-brand-primary hover:underline">
                        {p.judul}
                      </Link>
                      {p.sticky && (
                        <span title="Sematkan"><Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" /></span>
                      )}
                      {p.noindex && (
                        <span title="Tidak diindeks mesin pencari">
                          <EyeOff className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-gray-400">/berita/{p.slug}</div>
                    {p.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t.id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            <Tag className="h-2.5 w-2.5" /> {t.nama}
                          </span>
                        ))}
                        {p.tags.length > 3 && <span className="text-[10px] text-gray-400">+{p.tags.length - 3}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {p.kategori.nama}
                    {!p.kategori.tampil && <span className="ml-1 text-xs text-gray-400">(disembunyikan)</span>}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge post={p} />
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {format(p.publishedAt ?? p.createdAt, 'd MMM yyyy HH:mm', { locale: idLocale })}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{p.author?.nama ?? '-'}</td>
                  <td className="px-3 py-3 text-center">
                    <SeoScoreBadge score={p.seo.score} grade={p.seo.grade} compact />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600">{p.views}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditId(editId === p.id ? null : p.id)}
                        title="Edit cepat"
                        className="p-1.5 text-gray-500 hover:text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <a
                        href={`/berita/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Lihat di situs"
                        className="p-1.5 text-gray-500 hover:text-brand-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button type="button" onClick={() => salin(p.id)} title="Salin sebagai draft" className="p-1.5 text-gray-500 hover:text-brand-primary">
                        <Copy className="h-4 w-4" />
                      </button>
                      <DeletePostButton id={p.id} judul={p.judul} />
                    </div>
                  </td>
                </tr>
                {editId === p.id && (
                  <QuickEditRow row={p} kategori={kategoriOpsi} onClose={() => setEditId(null)} />
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Menampilkan {total === 0 ? 0 : dari}–{sampai} dari {total} berita
        </p>
        <div className="flex items-center gap-2">
          <select
            value={String(perPage)}
            onChange={(e) => router.push(`/admin/berita${qs({ per: e.target.value, halaman: undefined })}`)}
            aria-label="Jumlah per halaman"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / halaman</option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Link
            href={`/admin/berita${qs({ halaman: String(Math.max(1, page - 1)) })}`}
            aria-disabled={page <= 1}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-sm font-medium',
              page <= 1 ? 'pointer-events-none border-gray-200 text-gray-300' : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            )}
          >
            Sebelumnya
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/berita${qs({ halaman: String(n) })}`}
              className={clsx(
                'rounded-lg border px-3 py-1.5 text-sm font-medium',
                n === page ? 'border-brand-primary bg-brand-primary text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50',
              )}
            >
              {n}
            </Link>
          ))}
          <Link
            href={`/admin/berita${qs({ halaman: String(Math.min(totalPages, page + 1)) })}`}
            aria-disabled={page >= totalPages}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-sm font-medium',
              page >= totalPages ? 'pointer-events-none border-gray-200 text-gray-300' : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            )}
          >
            Berikutnya
          </Link>
        </div>
      )}
    </div>
  )
}
