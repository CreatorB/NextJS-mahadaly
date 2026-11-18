'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FolderOpen, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export interface BerkasDTO {
  path: string
  nama: string
  folder: string
  ukuran: number
  diubah: string
  dipakai: boolean
}

interface Ringkasan {
  files: BerkasDTO[]
  totalUkuran: number
  totalSemua: number
  jumlahSemua: number
  folder: string
}

function ukuran(Bytes: number): string {
  if (Bytes < 1024) return `${Bytes} B`
  if (Bytes < 1024 * 1024) return `${(Bytes / 1024).toFixed(1)} KB`
  if (Bytes < 1024 * 1024 * 1024) return `${(Bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(Bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * Panel manajemen berkas: daftar, unduh ZIP massal, hapus massal.
 */
export function BerkasManager({ awal }: { awal: Ringkasan }) {
  const router = useRouter()
  const [data, setData] = useState<Ringkasan>(awal)
  const [dipilih, setDipilih] = useState<string[]>([])
  const [folder, setFolder] = useState('semua')
  const [memuat, setMemuat] = useState(false)
  const [menyusunZip, setMenyusunZip] = useState(false)
  const [menghapus, setMenghapus] = useState(false)

  const daftar = useMemo(
    () => (folder === 'semua' ? data.files : data.files.filter((f) => f.folder === folder)),
    [data.files, folder],
  )

  const folderTersedia = useMemo(
    () => Array.from(new Set(data.files.map((f) => f.folder))).sort(),
    [data.files],
  )

  const muatUlang = async () => {
    setMemuat(true)
    try {
      const res = await fetch('/api/admin/berkas')
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal memuat daftar berkas')
        return
      }
      setData(json.data)
      setDipilih([])
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMemuat(false)
    }
  }

  const toggle = (p: string) => {
    setDipilih((d) => (d.includes(p) ? d.filter((x) => x !== p) : [...d, p]))
  }

  const toggleSemua = () => {
    setDipilih((d) => (d.length === daftar.length ? [] : daftar.map((f) => f.path)))
  }

  const unduhZip = async () => {
    if (!dipilih.length) {
      toast.error('Pilih minimal satu berkas.')
      return
    }
    setMenyusunZip(true)
    try {
      const res = await fetch('/api/admin/berkas/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: dipilih }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.message ?? 'Gagal membuat ZIP')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mahadaly-berkas-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`${dipilih.length} berkas diunduh dalam ZIP.`)
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMenyusunZip(false)
    }
  }

  const hapus = async (paksa: boolean) => {
    if (!dipilih.length) {
      toast.error('Pilih minimal satu berkas.')
      return
    }
    const catatan = paksa
      ? ' Berkas yang masih dipakai konten juga akan dihapus (paksa).'
      : ''
    const sure = window.confirm(
      `${dipilih.length} berkas akan dihapus permanen dari server.${catatan}\n\nLanjut?`,
    )
    if (!sure) return

    setMenghapus(true)
    try {
      const res = await fetch('/api/admin/berkas/hapus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: dipilih, paksa }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menghapus berkas')
        return
      }
      const { terhapus, gagal } = json.data as { terhapus: string[]; gagal: { path: string; alasan: string }[] }
      if (gagal.length) {
        toast.warning(
          `${terhapus.length} dihapus, ${gagal.length} gagal. ${gagal[0]?.alasan ?? ''} (${gagal[0]?.path ?? ''})`,
        )
      } else {
        toast.success(json.message ?? 'Berkas dihapus.')
      }
      await muatUlang()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setMenghapus(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Manajemen Berkas</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Daftar berkas yang bisa dikelola (materi panduan, gambar berita, poster event).
            Berkas pendaftar tidak ditampilkan di sini.
          </p>
        </div>
        <button
          type="button"
          onClick={muatUlang}
          disabled={memuat}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {memuat ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Muat ulang
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Berkas terkelola</div>
          <div className="text-xl font-bold text-gray-800">{data.files.length}</div>
          <div className="text-xs text-gray-400">{ukuran(data.totalUkuran)}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total folder upload</div>
          <div className="text-xl font-bold text-gray-800">{data.jumlahSemua}</div>
          <div className="text-xs text-gray-400">{ukuran(data.totalSemua)}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Lokasi penyimpanan</div>
          <div className="truncate font-mono text-xs text-gray-700" title={data.folder}>
            {data.folder}
          </div>
          <div className="text-xs text-gray-400">Belum termasuk berkas pendaftar</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFolder('semua')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            folder === 'semua'
              ? 'bg-brand-primary text-white'
              : 'bg-white border border-gray-200 text-gray-700'
          }`}
        >
          Semua folder
        </button>
        {folderTersedia.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFolder(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              folder === f
                ? 'bg-brand-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <strong>{dipilih.length}</strong> berkas dipilih dari {daftar.length} berkas
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={unduhZip}
            disabled={!dipilih.length || menyusunZip}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {menyusunZip ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Unduh ZIP
          </button>
          <button
            type="button"
            onClick={() => hapus(false)}
            disabled={!dipilih.length || menghapus}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {menghapus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hapus
          </button>
          <button
            type="button"
            onClick={() => hapus(true)}
            disabled={!dipilih.length || menghapus}
            title="Hapus даже berkas yang masih dipakai konten"
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Hapus paksa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={daftar.length > 0 && dipilih.length === daftar.length}
                  onChange={toggleSemua}
                  className="h-4 w-4 rounded border-gray-300"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Berkas</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Folder</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Ukuran</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Diubah</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada berkas di folder ini.
                </td>
              </tr>
            )}
            {daftar.map((f) => (
              <tr key={f.path} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={dipilih.includes(f.path)}
                    onChange={() => toggle(f.path)}
                    className="h-4 w-4 rounded border-gray-300"
                    aria-label={`Pilih ${f.nama}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/uploads/${f.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-brand-primary"
                  >
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    <span className="break-all">{f.nama}</span>
                  </a>
                  <div className="font-mono text-[11px] text-gray-400">{f.path}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{f.folder}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{ukuran(f.ukuran)}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(f.diubah).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  {f.dipakai ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      dipakai
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      tidak dipakai
                    </span>
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
