'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Send, FileEdit, CalendarClock, FolderInput, Tag, Pin, PinOff, Trash2, X } from 'lucide-react'
import type { BeritaFacets } from '@/lib/berita-admin'

interface Props {
  terpilih: number[]
  facets: BeritaFacets
  onClear: () => void
}

/**
 * Bilah aksi massal untuk baris berita yang dicentang.
 */
export function BulkActionBar({ terpilih, facets, onClear }: Props) {
  const router = useRouter()
  const [bekerja, setBekerja] = useState<string | null>(null)
  const [panel, setPanel] = useState<'kategori' | 'tag' | 'jadwal' | 'hapus' | null>(null)
  const [kategoriId, setKategoriId] = useState('')
  const [tag, setTag] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [ketikHapus, setKetikHapus] = useState('')

  if (terpilih.length === 0) return null

  async function jalankan(aksi: string, extra: Record<string, unknown> = {}) {
    setBekerja(aksi)
    try {
      const res = await fetch('/api/admin/berita/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: terpilih, aksi, ...extra }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Aksi gagal dijalankan.')
        return
      }
      toast.success(json.message ?? 'Selesai.')
      setPanel(null)
      setKategoriId('')
      setTag('')
      setTanggal('')
      setKetikHapus('')
      onClear()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setBekerja(null)
    }
  }

  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
  const aktif = (nama: string) => bekerja === nama

  const konfirmasiHapus = ketikHapus.trim().toUpperCase() === 'HAPUS'

  return (
    <div className="rounded-xl border border-brand-primary/30 bg-brand-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-brand-primary">{terpilih.length} berita dipilih</span>

        <button type="button" disabled={!!bekerja} onClick={() => jalankan('publish')} className={btn}>
          {aktif('publish') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Terbitkan
        </button>
        <button type="button" disabled={!!bekerja} onClick={() => jalankan('draft')} className={btn}>
          {aktif('draft') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileEdit className="h-3.5 w-3.5" />} Draft
        </button>

        <button type="button" disabled={!!bekerja} onClick={() => setPanel(panel === 'jadwal' ? null : 'jadwal')} className={btn}>
          <CalendarClock className="h-3.5 w-3.5" /> Jadwalkan
        </button>
        <button type="button" disabled={!!bekerja} onClick={() => setPanel(panel === 'kategori' ? null : 'kategori')} className={btn}>
          <FolderInput className="h-3.5 w-3.5" /> Ubah Kategori
        </button>
        <button type="button" disabled={!!bekerja} onClick={() => setPanel(panel === 'tag' ? null : 'tag')} className={btn}>
          <Tag className="h-3.5 w-3.5" /> Tambah Tag
        </button>

        <button type="button" disabled={!!bekerja} onClick={() => jalankan('sticky')} className={btn}>
          <Pin className="h-3.5 w-3.5" /> Sematkan
        </button>
        <button type="button" disabled={!!bekerja} onClick={() => jalankan('unsticky')} className={btn}>
          <PinOff className="h-3.5 w-3.5" /> Lepas Sematan
        </button>

        <button
          type="button"
          disabled={!!bekerja}
          onClick={() => setPanel(panel === 'hapus' ? null : 'hapus')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {aktif('hapus') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Hapus
        </button>

        <button type="button" onClick={onClear} className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <X className="h-3.5 w-3.5" /> Batalkan pilihan
        </button>
      </div>

      {panel === 'jadwal' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-primary/20 pt-3">
          <input
            type="datetime-local"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button
            type="button"
            disabled={!tanggal || !!bekerja}
            onClick={() => jalankan('schedule', { publishedAt: new Date(tanggal).toISOString() })}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Terapkan tanggal
          </button>
        </div>
      )}

      {panel === 'kategori' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-primary/20 pt-3">
          <select
            value={kategoriId}
            onChange={(e) => setKategoriId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">Pilih kategori…</option>
            {facets.kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!kategoriId || !!bekerja}
            onClick={() => jalankan('kategori', { kategoriId: Number(kategoriId) })}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Pindahkan
          </button>
        </div>
      )}

      {panel === 'tag' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-primary/20 pt-3">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Nama tag…"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button
            type="button"
            disabled={!tag.trim() || !!bekerja}
            onClick={() => jalankan('tag', { tagSlug: tag.trim() })}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Tambahkan tag
          </button>
        </div>
      )}

      {panel === 'hapus' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="text-xs text-red-800">
            Hapus <strong>{terpilih.length}</strong> berita terpilih? Tindakan ini tidak bisa dibatalkan. Ketik{' '}
            <strong>HAPUS</strong> untuk melanjutkan.
          </p>
          <input
            value={ketikHapus}
            onChange={(e) => setKetikHapus(e.target.value)}
            placeholder="HAPUS"
            aria-label="Konfirmasi ketik HAPUS"
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="button"
            disabled={!konfirmasiHapus || !!bekerja}
            onClick={() => {
              setKetikHapus('')
              void jalankan('hapus')
            }}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Hapus permanen
          </button>
        </div>
      )}
    </div>
  )
}
