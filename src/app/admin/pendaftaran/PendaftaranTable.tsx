'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Upload, CheckCircle2, XCircle, Sparkles, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { PREDIKAT_OPTIONS, KELULUSAN_CATATAN_TEMPLATE, PREDIKAT_LULUS_DENGAN_CATATAN } from '@/lib/kelulusan-template'

export interface PendaftaranRow {
  id: number
  kodeRegistrasi: string
  nama: string
  jk: string
  programNama: string
  statusPendaftaran: string
  statusTransfer: string
  kelulusan: string | null
  predikat: string | null
  createdAt: string
}

interface Props {
  rows: PendaftaranRow[]
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

export function PendaftaranTable({ rows }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [bulkKelulusanOpen, setBulkKelulusanOpen] = useState(false)
  const [bulkKelulusan, setBulkKelulusan] = useState<'lulus' | 'tidak_lulus'>('lulus')
  const [bulkPredikat, setBulkPredikat] = useState('')
  const [bulkCatatan, setBulkCatatan] = useState('')
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResult, setCsvResult] = useState<{
    totalRows: number
    matched: number
    updated: number
    unmatched: string[]
    failed: string[]
  } | null>(null)
  const [csvModalOpen, setCsvModalOpen] = useState(false)

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set())
    else setSelected(new Set(rows.map((r) => r.kodeRegistrasi)))
  }

  const toggle = (kode: string) => {
    const next = new Set(selected)
    if (next.has(kode)) next.delete(kode)
    else next.add(kode)
    setSelected(next)
  }

  const bulkUpdateStatus = async (field: 'statusPendaftaran' | 'statusTransfer', value: string) => {
    if (selected.size === 0) return toast.error('Pilih minimal 1 pendaftar')
    setBusy(true)
    try {
      const results = await Promise.all(
        Array.from(selected).map((kode) =>
          fetch(`/api/pendaftaran/${kode}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
          }).then((r) => r.json()).then((j) => ({ kode, ok: j.success, msg: j.message })),
        ),
      )
      const failed = results.filter((r) => !r.ok)
      if (failed.length === 0) {
        toast.success(`${selected.size} data berhasil diperbarui`)
      } else {
        toast.error(`${failed.length} gagal, ${results.length - failed.length} sukses`)
      }
      setSelected(new Set())
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setBusy(false)
    }
  }

  const openBulkKelulusan = () => {
    if (selected.size === 0) return toast.error('Pilih minimal 1 pendaftar')
    setBulkCatatan('')
    setBulkPredikat('')
    setBulkKelulusan('lulus')
    setBulkKelulusanOpen(true)
  }

  const applyTemplateCatatan = () => {
    setBulkCatatan(KELULUSAN_CATATAN_TEMPLATE)
    if (!bulkPredikat) setBulkPredikat(PREDIKAT_LULUS_DENGAN_CATATAN)
  }

  const submitBulkKelulusan = async () => {
    setBusy(true)
    try {
      const results = await Promise.all(
        Array.from(selected).map((kode) =>
          fetch(`/api/pendaftaran/${kode}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kelulusan: bulkKelulusan,
              predikat: bulkPredikat || null,
              catatan: bulkCatatan || null,
            }),
          }).then((r) => r.json()).then((j) => ({ kode, ok: j.success, msg: j.message })),
        ),
      )
      const failed = results.filter((r) => !r.ok)
      if (failed.length === 0) {
        toast.success(`${selected.size} data kelulusan diperbarui`)
      } else {
        toast.error(`${failed.length} gagal, ${results.length - failed.length} sukses`)
      }
      setBulkKelulusanOpen(false)
      setSelected(new Set())
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setBusy(false)
    }
  }

  const handleCsvUpload = async (file: File) => {
    setCsvUploading(true)
    setCsvResult(null)
    setCsvModalOpen(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/santri/bulk-kelulusan', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Upload gagal')
        setCsvModalOpen(false)
        return
      }
      setCsvResult(json.data)
      toast.success(`Berhasil update ${json.data.updated} dari ${json.data.matched} matched`)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
      setCsvModalOpen(false)
    } finally {
      setCsvUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'No.,NAMA ASLI,JK,HASIL TES,,,KETERANGAN\n1,CONTOH NAMA,L,LULUS,,,Mumtaz\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-kelulusan.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-blue-900">
            {selected.size} dipilih
          </span>
          <button
            type="button"
            onClick={() => bulkUpdateStatus('statusPendaftaran', 'approved')}
            disabled={busy || pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Setujui Pendaftaran
          </button>
          <button
            type="button"
            onClick={() => bulkUpdateStatus('statusPendaftaran', 'rejected')}
            disabled={busy || pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" /> Tolak Pendaftaran
          </button>
          <button
            type="button"
            onClick={() => bulkUpdateStatus('statusTransfer', 'approved')}
            disabled={busy || pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Setujui Transfer
          </button>
          <button
            type="button"
            onClick={openBulkKelulusan}
            disabled={busy || pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> Set Kelulusan
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={busy || pending}
            className="ml-auto text-xs text-blue-700 hover:underline"
          >
            Batal
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-2 py-3 w-8">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kode</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">JK</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Program</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pendaftaran</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Transfer</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kelulusan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Predikat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50 ${selected.has(s.kodeRegistrasi) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-2 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(s.kodeRegistrasi)}
                    onChange={() => toggle(s.kodeRegistrasi)}
                    aria-label={`Pilih ${s.nama}`}
                  />
                </td>
                <td className="px-4 py-3 font-mono font-medium text-brand-primary">{s.kodeRegistrasi}</td>
                <td className="px-4 py-3 font-medium">{s.nama}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.jk === 'Laki-Laki' ? 'info' : 'default'}>{s.jk === 'Laki-Laki' ? 'Ikhwan' : 'Akhwat'}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">{s.programNama}</td>
                <td className="px-4 py-3">{statusBadge(s.statusPendaftaran)}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.statusTransfer === 'approved' ? 'approved' : s.statusTransfer === 'rejected' ? 'rejected' : 'pending'}>
                    {s.statusTransfer}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {s.kelulusan === 'lulus' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Lulus</span>}
                  {s.kelulusan === 'tidak_lulus' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Tidak Lulus</span>}
                  {!s.kelulusan && <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{s.predikat ?? <span className="text-gray-400">-</span>}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(s.createdAt), 'dd/MM/yy')}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pendaftaran/${s.kodeRegistrasi}`} className="text-brand-secondary hover:underline text-xs font-medium">Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bulkKelulusanOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-brand-primary mb-1">Set Kelulusan (massal)</h2>
            <p className="text-sm text-gray-500 mb-4">{selected.size} pendaftar akan diperbarui.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hasil Kelulusan</label>
                <select
                  value={bulkKelulusan}
                  onChange={(e) => setBulkKelulusan(e.target.value as 'lulus' | 'tidak_lulus')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="lulus">Lulus</option>
                  <option value="tidak_lulus">Tidak Lulus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Predikat</label>
                <select
                  value={bulkPredikat}
                  onChange={(e) => setBulkPredikat(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-</option>
                  {PREDIKAT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Catatan</label>
                  <button
                    type="button"
                    onClick={applyTemplateCatatan}
                    className="text-xs text-brand-secondary hover:underline"
                  >
                    Gunakan Template Catatan
                  </button>
                </div>
                <textarea
                  value={bulkCatatan}
                  onChange={(e) => setBulkCatatan(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
                  placeholder="Catatan kelulusan (kosongkan jika tidak ada)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setBulkKelulusanOpen(false)}
                disabled={busy}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitBulkKelulusan}
                disabled={busy || pending}
                className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {csvModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-lg font-bold text-brand-primary mb-1">Upload CSV Kelulusan</h2>
            <p className="text-sm text-gray-500 mb-4">Format: 4 baris header, header di baris ke-5, data mulai baris ke-7.</p>

            {csvUploading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                <span className="ml-3 text-sm text-gray-600">Memproses CSV...</span>
              </div>
            ) : csvResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-700">Total Baris</p>
                    <p className="text-2xl font-bold text-blue-900">{csvResult.totalRows}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-700">Cocok & Update</p>
                    <p className="text-2xl font-bold text-green-900">{csvResult.updated}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-700">Tidak Cocok</p>
                    <p className="text-2xl font-bold text-amber-900">{csvResult.unmatched.length}</p>
                  </div>
                </div>
                {csvResult.unmatched.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Nama tidak ditemukan di DB:</p>
                    <ul className="text-xs text-amber-700 list-disc list-inside max-h-32 overflow-auto">
                      {csvResult.unmatched.map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </div>
                )}
                {csvResult.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-800 mb-1">Gagal update:</p>
                    <ul className="text-xs text-red-700 list-disc list-inside max-h-32 overflow-auto">
                      {csvResult.failed.map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => { setCsvResult(null); setCsvModalOpen(false) }}
                    className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:opacity-90"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <input
        id="csv-upload-input"
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleCsvUpload(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

export function CsvUploadButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById('csv-upload-input')?.click()}
      className={className ?? 'inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors'}
    >
      <Upload className="h-4 w-4" />
      Upload CSV / Excel Kelulusan
    </button>
  )
}

export function DownloadKelulusanButton({ className }: { className?: string }) {
  return (
    <a
      href="/api/admin/santri/export/kelulusan"
      className={className ?? 'inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors'}
    >
      <Download className="h-4 w-4" />
      Download Excel Kelulusan
    </a>
  )
}
