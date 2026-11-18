'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import type { BeritaFacets } from '@/lib/berita-admin'

const STATUS_PILIHAN = [
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Terbit' },
  { key: 'scheduled', label: 'Terjadwal' },
]

const URUTKAN = [
  { key: 'terbaru', label: 'Terbaru' },
  { key: 'terlama', label: 'Terlama' },
  { key: 'judul', label: 'Judul A-Z' },
  { key: 'diperbarui', label: 'Terakhir diubah' },
  { key: 'views', label: 'Paling dilihat' },
]

/**
 * Filter daftar berita. Semua state disimpan di URL supaya bisa dibagikan
 * dan tetap berlaku setelah halaman dimuat ulang.
 */
export function BeritaFilters({ facets }: { facets: BeritaFacets }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [cari, setCari] = useState(sp.get('q') ?? '')
  const [buka, setBuka] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const status = (sp.get('status') ?? '').split(',').filter(Boolean)
  const kategori = (sp.get('kategori') ?? '').split(',').filter(Boolean)
  const tag = (sp.get('tag') ?? '').split(',').filter(Boolean)
  const urutkan = sp.get('urutkan') ?? 'terbaru'
  const arah = sp.get('arah') ?? 'desc'
  const dari = sp.get('dari') ?? ''
  const sampai = sp.get('sampai') ?? ''

  const aktif =
    status.length + kategori.length + tag.length + (sp.get('q') ? 1 : 0) + (dari ? 1 : 0) + (sampai ? 1 : 0)

  // Pencarian: tunggu tombol berhenti mengetik sebelum memanggil server.
  useEffect(() => {
    const nilai = cari.trim()
    if (nilai === (sp.get('q') ?? '')) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      update({ q: nilai || undefined }, false)
    }, 350)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari])

  function update(perubahan: Record<string, string | undefined>, resetHalaman = true) {
    const p = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(perubahan)) {
      if (v === undefined || v === '') p.delete(k)
      else p.set(k, v)
    }
    if (resetHalaman) p.delete('halaman')
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function toggleNilai(list: string[], nilai: string) {
    return list.includes(nilai) ? list.filter((v) => v !== nilai) : [...list, nilai]
  }

  const chip = (aktif: boolean) =>
    clsx(
      'rounded-full px-3 py-1 text-xs font-medium transition',
      aktif ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-primary',
    )

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari judul, isi, atau slug…"
            aria-label="Cari berita"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <select
          value={urutkan}
          onChange={(e) => update({ urutkan: e.target.value })}
          aria-label="Urutkan"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {URUTKAN.map((u) => (
            <option key={u.key} value={u.key}>{u.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => update({ arah: arah === 'desc' ? 'asc' : 'desc' })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          title="Balik arah urutan"
        >
          {arah === 'desc' ? 'Turun' : 'Naik'}
        </button>

        <button
          type="button"
          onClick={() => setBuka((b) => !b)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
            buka || aktif > 0 ? 'border-brand-primary text-brand-primary' : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {aktif > 0 && <span className="rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] text-white">{aktif}</span>}
          <ChevronDown className={clsx('h-4 w-4 transition-transform', buka && 'rotate-180')} />
        </button>

        {aktif > 0 && (
          <button
            type="button"
            onClick={() => {
              setCari('')
              update({ q: undefined, status: undefined, kategori: undefined, tag: undefined, dari: undefined, sampai: undefined })
            }}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      {buka && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_PILIHAN.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => update({ status: toggleNilai(status, s.key).join(',') || undefined })}
                  className={chip(status.includes(s.key))}
                >
                  {s.label}
                  <span className="ml-1 opacity-60">
                    {s.key === 'draft' ? facets.status.draft : s.key === 'published' ? facets.status.published : facets.status.scheduled}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {facets.kategori.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => update({ kategori: toggleNilai(kategori, k.slug).join(',') || undefined })}
                  className={chip(kategori.includes(k.slug))}
                >
                  {k.nama}
                  <span className="ml-1 opacity-60">{k.count}</span>
                </button>
              ))}
            </div>
          </div>

          {facets.tag.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tag</p>
              <div className="flex flex-wrap gap-2">
                {facets.tag.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update({ tag: toggleNilai(tag, t.slug).join(',') || undefined })}
                    className={chip(tag.includes(t.slug))}
                  >
                    {t.nama}
                    <span className="ml-1 opacity-60">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Rentang tanggal terbit</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dari}
                onChange={(e) => update({ dari: e.target.value || undefined })}
                aria-label="Dari tanggal"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <span className="text-gray-400">s/d</span>
              <input
                type="date"
                value={sampai}
                onChange={(e) => update({ sampai: e.target.value || undefined })}
                aria-label="Sampai tanggal"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
