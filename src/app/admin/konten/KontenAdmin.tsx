'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Pencil, RotateCcw, Save, Type } from 'lucide-react'
import { toast } from 'sonner'
import {
  DAFTAR_DEFS,
  GRUP_LIST,
  KONTEN_MAP,
  TAG_HINT,
  type KontenTipe,
} from '@/lib/konten-shared'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { KontenItemModal } from './KontenItemModal'

export interface KontenRowDTO {
  id: number
  key: string
  label: string
  tipe: string
  grup: string
  nilai: string
  urutan: number
  tampil: boolean
  updatedAt: string
}

export interface KontenItemDTO {
  id: number
  grup: string
  judul: string
  deskripsi: string | null
  url: string | null
  ikon: string | null
  fileUrl: string | null
  fileName: string | null
  urutan: number
  tampil: boolean
  updatedAt: string
}

const TIPE_LABEL: Record<string, string> = {
  teks: 'Teks pendek',
  textarea: 'Teks panjang',
  wysiwyg: 'Rich text',
  url: 'Tautan',
}

/** Buang tag HTML untuk pratinjau ringkas. */
function ringkas(nilai: string): string {
  return (nilai ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function KontenAdmin({
  rows,
  items,
}: {
  rows: KontenRowDTO[]
  items: KontenItemDTO[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [tab, setTab] = useState<'teks' | 'daftar'>('teks')
  const [grupTeks, setGrupTeks] = useState(GRUP_LIST[0]?.id ?? 'beranda')
  const [grupDaftar, setGrupDaftar] = useState(DAFTAR_DEFS[0]?.grup ?? 'pengajar')

  // Key yang sedang disunting (editor terbuka).
  const [buka, setBuka] = useState<string | null>(null)
  // Nilai sementara sebelum disimpan.
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [simpanKey, setSimpanKey] = useState<string | null>(null)

  // Modal item daftar.
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item: KontenItemDTO | null } | null>(
    null,
  )

  const barisTeks = useMemo(() => rows.filter((r) => r.grup === grupTeks), [rows, grupTeks])
  const itemDaftar = useMemo(
    () => items.filter((i) => i.grup === grupDaftar).sort((a, b) => a.urutan - b.urutan),
    [items, grupDaftar],
  )
  const defDaftar = DAFTAR_DEFS.find((d) => d.grup === grupDaftar)

  const nilaiSaatIni = (r: KontenRowDTO) => draft[r.key] ?? r.nilai

  const bukaBaris = (r: KontenRowDTO) => {
    setBuka(r.key)
    setDraft((d) => ({ ...d, [r.key]: r.nilai }))
  }

  const simpan = async (r: KontenRowDTO) => {
    setSimpanKey(r.key)
    try {
      const res = await fetch('/api/admin/konten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: r.key, nilai: nilaiSaatIni(r), tampil: r.tampil }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      setBuka(null)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSimpanKey(null)
    }
  }

  const kembalikanBawaan = (r: KontenRowDTO) => {
    const bawaan = KONTEN_MAP[r.key]?.nilai ?? ''
    setDraft((d) => ({ ...d, [r.key]: bawaan }))
    toast.info('Nilai bawaan dipasang. Klik Simpan untuk menerapkan.')
  }

  const toggleTampil = async (r: KontenRowDTO) => {
    try {
      const res = await fetch('/api/admin/konten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: r.key, nilai: nilaiSaatIni(r), tampil: !r.tampil }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal mengubah status')
        return
      }
      toast.success(json.message ?? 'Status diperbarui')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  const hapusItem = async (item: KontenItemDTO) => {
    const sure = window.confirm(`"${item.judul}" akan dihapus dari daftar. Lanjut?`)
    if (!sure) return
    try {
      const res = await fetch(`/api/admin/konten/item/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menghapus')
        return
      }
      toast.success(json.message ?? 'Item dihapus')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Konten Website</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">
          Semua teks dan daftar pada halaman publik bisa disunting dari sini. Perubahan
          langsung tampil di website setelah disimpan.
        </p>
      </div>

      {/* Tab utama */}
      <div className="flex gap-2 border-b border-gray-200">
        {(
          [
            ['teks', 'Teks & Label'],
            ['daftar', 'Daftar Item'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${
              tab === id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'teks' && (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Pilih halaman */}
          <div className="space-y-1">
            {GRUP_LIST.map((g) => {
              const aktif = g.id === grupTeks
              const jumlah = rows.filter((r) => r.grup === g.id).length
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGrupTeks(g.id)
                    setBuka(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    aktif
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-primary'
                  }`}
                >
                  {g.label}
                  <span className={`ml-2 text-xs ${aktif ? 'text-white/70' : 'text-gray-400'}`}>
                    {jumlah}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Daftar key */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 bg-brand-surface border border-gray-100 rounded-lg px-3 py-2">
              {TAG_HINT}
            </p>

            {barisTeks.map((r) => {
              const def = KONTEN_MAP[r.key]
              const tipe = (def?.tipe ?? r.tipe) as KontenTipe
              const nilai = nilaiSaatIni(r)
              const terbuka = buka === r.key
              const berubah = (draft[r.key] ?? r.nilai) !== r.nilai

              return (
                <div
                  key={r.key}
                  className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-800">{r.label}</span>
                        <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[11px] text-gray-500">
                          {TIPE_LABEL[tipe] ?? tipe}
                        </span>
                        {!r.tampil && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                            disembunyikan
                          </span>
                        )}
                        {berubah && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                            belum disimpan
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 mt-0.5">{r.key}</div>
                      {!terbuka && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {ringkas(nilai) || <span className="italic text-gray-400">(kosong)</span>}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleTampil(r)}
                        title={r.tampil ? 'Sembunyikan dari halaman publik' : 'Tampilkan di halaman publik'}
                        className="p-2 text-gray-400 hover:text-brand-primary"
                      >
                        {r.tampil ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      {terbuka ? (
                        <>
                          <button
                            type="button"
                            onClick={() => simpan(r)}
                            disabled={simpanKey === r.key}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {simpanKey === r.key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuka(null)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Tutup
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => bukaBaris(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Sunting
                        </button>
                      )}
                    </div>
                  </div>

                  {terbuka && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-3">
                      {tipe === 'wysiwyg' ? (
                        <div data-editor="konten">
                          <RichTextEditor
                            value={nilai}
                            onChange={(v) => setDraft((d) => ({ ...d, [r.key]: v }))}
                          />
                        </div>
                      ) : tipe === 'textarea' ? (
                        <textarea
                          value={nilai}
                          onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      ) : (
                        <input
                          value={nilai}
                          onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
                          placeholder={tipe === 'url' ? 'https://...' : ''}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => kembalikanBawaan(r)}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Kembalikan nilai bawaan
                        </button>
                        <span className="text-[11px] text-gray-400">
                          Diperbarui {new Date(r.updatedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'daftar' && (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className="space-y-1">
            {DAFTAR_DEFS.map((d) => {
              const aktif = d.grup === grupDaftar
              const jumlah = items.filter((i) => i.grup === d.grup).length
              return (
                <button
                  key={d.grup}
                  type="button"
                  onClick={() => setGrupDaftar(d.grup)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    aktif
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-primary'
                  }`}
                >
                  {d.label}
                  <span className={`ml-2 text-xs ${aktif ? 'text-white/70' : 'text-gray-400'}`}>
                    {jumlah}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            {defDaftar?.helper && (
              <p className="text-xs text-gray-500 bg-brand-surface border border-gray-100 rounded-lg px-3 py-2">
                {defDaftar.helper}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModal({ mode: 'create', item: null })}
                className="inline-flex items-center gap-2 bg-brand-primary px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
              >
                <Type className="h-4 w-4" /> Tambah {defDaftar?.itemLabel ?? 'Item'}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-surface border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Urutan</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {defDaftar?.itemLabel ?? 'Item'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Keterangan</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemDaftar.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        Belum ada item. Klik <strong>Tambah</strong> untuk membuat.
                      </td>
                    </tr>
                  )}
                  {itemDaftar.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{it.urutan}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{it.judul}</span>
                        {it.fileUrl && (
                          <a
                            href={it.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-brand-primary hover:underline"
                          >
                            {it.fileName ?? it.fileUrl}
                          </a>
                        )}
                        {it.url && !it.fileUrl && (
                          <a
                            href={it.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-brand-primary hover:underline"
                          >
                            {it.url}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {it.deskripsi ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            it.tampil ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {it.tampil ? 'Tampil' : 'Disembunyikan'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setModal({ mode: 'edit', item: it })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => hapusItem(it)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal && defDaftar && (
        <KontenItemModal
          def={defDaftar}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            startTransition(() => router.refresh())
          }}
        />
      )}
    </div>
  )
}
