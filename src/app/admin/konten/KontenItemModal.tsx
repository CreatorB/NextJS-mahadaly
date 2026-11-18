'use client'
import { useState } from 'react'
import { Loader2, Save, Upload, X, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { IKON_PILIHAN } from '@/lib/konten-ikon'
import type { DaftarDef } from '@/lib/konten-shared'
import type { KontenItemDTO } from './KontenAdmin'

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

/**
 * Modal tambah/ubah satu item daftar konten.
 *
 * Untuk grup `materi` tersedia unggah berkas: nama berkas otomatis
 * `mahadaly-<slug judul>-<timestamp>.<ext>` dan berkas lama otomatis dihapus
 * saat item disimpan dengan berkas baru.
 */
export function KontenItemModal({
  def,
  item,
  onClose,
  onSaved,
}: {
  def: DaftarDef
  item: KontenItemDTO | null
  onClose: () => void
  onSaved: () => void
}) {
  const [judul, setJudul] = useState(item?.judul ?? '')
  const [deskripsi, setDeskripsi] = useState(item?.deskripsi ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [ikon, setIkon] = useState(item?.ikon ?? '')
  const [fileUrl, setFileUrl] = useState(item?.fileUrl ?? '')
  const [fileName, setFileName] = useState(item?.fileName ?? '')
  const [lain, setLain] = useState<Record<string, string>>({})
  const [urutan, setUrutan] = useState(String(item?.urutan ?? 0))
  const [tampil, setTampil] = useState(item?.tampil ?? true)

  const [mengunggah, setMengunggah] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)

  const opsiIkon = def.fields.find((f) => f.name === 'ikon')?.opsi

  const unggah = async (file: File | undefined) => {
    if (!file) return
    if (!judul.trim()) {
      toast.error('Isi judul dokumen dulu sebelum mengunggah berkas.')
      return
    }
    setMengunggah(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('judul', judul.trim())
      const res = await fetch('/api/admin/konten/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Upload gagal')
        return
      }
      setFileUrl(json.data.url)
      setFileName(json.data.nama)
      toast.success(json.message ?? 'Berkas diunggah')
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMengunggah(false)
    }
  }

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setMenyimpan(true)
    const payload = {
      grup: def.grup,
      judul: judul.trim(),
      deskripsi: deskripsi.trim() ? deskripsi.trim() : null,
      url: url.trim() ? url.trim() : null,
      ikon: ikon || null,
      fileUrl: fileUrl.trim() ? fileUrl.trim() : null,
      fileName: fileName.trim() ? fileName.trim() : null,
      urutan: Number(urutan) || 0,
      tampil,
    }
    try {
      const res = await fetch(
        item ? `/api/admin/konten/item/${item.id}` : '/api/admin/konten/item',
        { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success(json.message ?? 'Tersimpan')
      onSaved()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl my-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              {item ? 'Ubah' : 'Tambah'} {def.itemLabel}
            </h2>
            <p className="text-xs text-gray-500">{def.label}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={simpan} className="space-y-4 px-5 py-4">
          {def.fields.map((f) => {
            if (f.name === 'fileUrl') {
              return (
                <div key={f.name}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{f.label}</label>
                  <div className="space-y-2">
                    {fileUrl && (
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate text-sm text-brand-primary hover:underline"
                        >
                          {fileName || fileUrl}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFileUrl('')
                            setFileName('')
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          lepas
                        </button>
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-brand-primary hover:text-brand-primary">
                      {mengunggah ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {mengunggah ? 'Mengunggah...' : 'Unggah berkas (PDF/DOC/XLS/PPT/ZIP)'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                        disabled={mengunggah}
                        onChange={(e) => {
                          void unggah(e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Nama berkas otomatis: <span className="font-mono">mahadaly-&lt;judul&gt;-&lt;waktu&gt;</span>.
                      Berkas lama otomatis terhapus saat berkas baru disimpan.
                    </p>
                  </div>
                </div>
              )
            }

            if (f.name === 'fileName') {
              return (
                <div key={f.name}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{f.label}</label>
                  <input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="contoh: Panduan-PSB-2026.pdf"
                    className={input}
                  />
                </div>
              )
            }

            if (f.name === 'ikon') {
              const daftar = opsiIkon
                ? IKON_PILIHAN.filter((i) => opsiIkon.includes(i.nilai))
                : IKON_PILIHAN
              return (
                <div key={f.name}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{f.label}</label>
                  <select value={ikon} onChange={(e) => setIkon(e.target.value)} className={input}>
                    <option value="">— tanpa ikon —</option>
                    {daftar.map((i) => (
                      <option key={i.nilai} value={i.nilai}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }

            const wajib = f.required
            if (f.tipe === 'textarea') {
              return (
                <div key={f.name}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {f.label}
                    {wajib && <span className="text-red-500"> *</span>}
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    rows={3}
                    required={wajib}
                    className={input}
                  />
                </div>
              )
            }

            if (f.tipe === 'url') {
              return (
                <div key={f.name}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {f.label}
                    {wajib && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    required={wajib}
                    className={input}
                  />
                </div>
              )
            }

            return (
              <div key={f.name}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {f.label}
                  {wajib && <span className="text-red-500"> *</span>}
                </label>
                {f.name === 'judul' ? (
                  <input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    required={wajib}
                    maxLength={191}
                    className={input}
                  />
                ) : (
                  <input
                    value={lain[f.name] ?? ''}
                    onChange={(e) => setLain((l) => ({ ...l, [f.name]: e.target.value }))}
                    required={wajib}
                    className={input}
                  />
                )}
              </div>
            )
          })}

          <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="flex items-end pb-2">
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
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={menyimpan || mengunggah}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {menyimpan ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
