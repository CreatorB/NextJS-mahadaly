'use client'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  UserX,
  X,
  Upload,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react'
import { ExportLink } from '@/components/admin/ExportButtons'

export interface BarisPegawai {
  id: number
  kode: string | null
  nama: string
  jabatan: string | null
  noHp: string | null
  email: string | null
  nik: string | null
  jk: string | null
  tmpLahir: string | null
  pendidikan: string | null
  statusPernikahan: string | null
  alamat: string | null
  tahunBergabung: string | null
  kontakKeluarga: string | null
  jamMasuk: string | null
  jamPulang: string | null
  toleransiMenit: number | null
  isActive: boolean
  akun: { id: number; email: string; isActive: boolean; passwordSudahDiubah: boolean } | null
  absensi30Hari: { hadir: number; telat: number; total: number }
}

const KOSONG = {
  nama: '',
  kode: '',
  jabatan: '',
  noHp: '',
  email: '',
  nik: '',
  jk: '',
  tmpLahir: '',
  pendidikan: '',
  statusPernikahan: '',
  alamat: '',
  tahunBergabung: '',
  kontakKeluarga: '',
  jamMasuk: '',
  jamPulang: '',
  toleransiMenit: '',
}

export function PegawaiClient({ data }: { data: BarisPegawai[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...KOSONG })
  const [loading, setLoading] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [terpilih, setTerpilih] = useState<number[]>([])
  const [bulkJabatan, setBulkJabatan] = useState('')
  const [bulkJamMasuk, setBulkJamMasuk] = useState('')
  const [bulkJamPulang, setBulkJamPulang] = useState('')

  const set =
    (k: keyof typeof KOSONG) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const hasil = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return data
    return data.filter((p) =>
      [p.nama, p.jabatan, p.noHp, p.email, p.nik, p.kode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(key)),
    )
  }, [data, q])

  const semuaTerpilih = hasil.length > 0 && hasil.every((p) => terpilih.includes(p.id))

  const toggleSemua = () => {
    if (semuaTerpilih) {
      setTerpilih((t) => t.filter((id) => !hasil.some((p) => p.id === id)))
    } else {
      setTerpilih((t) => Array.from(new Set([...t, ...hasil.map((p) => p.id)])))
    }
  }

  const toggleSatu = (id: number) =>
    setTerpilih((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))

  const bukaTambah = () => {
    setForm({ ...KOSONG })
    setEditId(null)
    setFormOpen(true)
  }

  const bukaEdit = (p: BarisPegawai) => {
    setForm({
      nama: p.nama ?? '',
      kode: p.kode ?? '',
      jabatan: p.jabatan ?? '',
      noHp: p.noHp ?? '',
      email: p.email ?? '',
      nik: p.nik ?? '',
      jk: p.jk ?? '',
      tmpLahir: p.tmpLahir ?? '',
      pendidikan: p.pendidikan ?? '',
      statusPernikahan: p.statusPernikahan ?? '',
      alamat: p.alamat ?? '',
      tahunBergabung: p.tahunBergabung ?? '',
      kontakKeluarga: p.kontakKeluarga ?? '',
      jamMasuk: p.jamMasuk ? p.jamMasuk.slice(0, 5) : '',
      jamPulang: p.jamPulang ? p.jamPulang.slice(0, 5) : '',
      toleransiMenit: p.toleransiMenit != null ? String(p.toleransiMenit) : '',
    })
    setEditId(p.id)
    setFormOpen(true)
  }

  const simpan = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        toleransiMenit: form.toleransiMenit === '' ? null : Number(form.toleransiMenit),
      }
      const res = await fetch(editId ? `/api/admin/pegawai/${editId}` : '/api/admin/pegawai', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Gagal menyimpan pegawai.')
        return
      }
      toast.success(json.message ?? 'Tersimpan.')
      setFormOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const jalankanBulk = async (aksi: string, extra: Record<string, unknown> = {}) => {
    if (terpilih.length === 0) {
      toast.error('Pilih minimal satu pegawai.')
      return
    }
    try {
      const res = await fetch('/api/admin/pegawai/bulk', {
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
      setTerpilih([])
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    }
  }

  const resetPassword = async (p: BarisPegawai) => {
    if (!confirm(`Reset password ${p.nama} ke 123456?`)) return
    await jalankanBulk('reset-password')
  }

  const nonaktifkan = async (p: BarisPegawai) => {
    if (!confirm(`Nonaktifkan akun ${p.nama}?`)) return
    try {
      const res = await fetch(`/api/admin/pegawai/${p.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Gagal menonaktifkan.')
        return
      }
      toast.success(json.message ?? 'Pegawai dinonaktifkan.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    }
  }

  const handleImport = async (file: File) => {
    setUploadBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/pegawai/import', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Import gagal.')
        return
      }
      toast.success(json.message ?? 'Import selesai.')
      if (json.data?.catatan?.length) {
        toast.message(json.data.catatan.join('\n'), { duration: 12000 })
      }
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setUploadBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const sel = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Data Pegawai</h1>
          <p className="text-sm text-gray-500">
            Master data staf Ma&apos;had Aly. Password awal setiap akun:{' '}
            <code className="rounded bg-gray-100 px-1">123456</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImport(f)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {uploadBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import Excel
          </button>
          <ExportLink href="/api/admin/pegawai/export?format=xls" label="Excel" kind="excel" />
          <ExportLink href="/api/admin/pegawai/export?format=csv" label="CSV" kind="csv" />
          <button
            onClick={bukaTambah}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah Pegawai
          </button>
        </div>
      </div>

      {/* Baris aksi massal */}
      {terpilih.length > 0 && (
        <div className="mt-4 rounded-xl border border-brand-primary/30 bg-brand-surface p-4">
          <p className="mb-3 text-sm font-semibold text-brand-primary">
            {terpilih.length} pegawai dipilih
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600" htmlFor="b-jabatan">Ubah jabatan</label>
              <div className="flex gap-1">
                <input
                  id="b-jabatan"
                  value={bulkJabatan}
                  onChange={(e) => setBulkJabatan(e.target.value)}
                  placeholder="Jabatan baru"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  onClick={() => void jalankanBulk('set-jabatan', { jabatan: bulkJabatan })}
                  disabled={!bulkJabatan.trim()}
                  className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Terapkan
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600" htmlFor="b-masuk">Set jam kerja</label>
              <div className="flex flex-wrap items-center gap-1">
                <input
                  id="b-masuk"
                  type="time"
                  value={bulkJamMasuk}
                  onChange={(e) => setBulkJamMasuk(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  id="b-pulang"
                  type="time"
                  value={bulkJamPulang}
                  onChange={(e) => setBulkJamPulang(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  onClick={() =>
                    void jalankanBulk('set-jam-kerja', {
                      jamMasuk: bulkJamMasuk,
                      jamPulang: bulkJamPulang,
                    })
                  }
                  disabled={!bulkJamMasuk || !bulkJamPulang}
                  className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Terapkan
                </button>
                <button
                  onClick={() => void jalankanBulk('reset-jam-kerja')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Pakai global
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void jalankanBulk('aktifkan')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Aktifkan
              </button>
              <button
                onClick={() => void jalankanBulk('nonaktifkan')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                Nonaktifkan
              </button>
              <button
                onClick={() => void jalankanBulk('reset-password')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset password
              </button>
              <button
                onClick={() => setTerpilih([])}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Batal pilih
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / jabatan / WA / email / kode..."
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              <th className="w-10 px-3 py-2 text-left">
                <button onClick={toggleSemua} aria-label="Pilih semua">
                  {semuaTerpilih ? (
                    <CheckSquare className="h-4 w-4 text-brand-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              {['Kode', 'Nama', 'Jabatan', 'No WA', 'Email', 'Jam Kerja', 'Akun', 'Absen 30h', 'Status', 'Aksi'].map(
                (h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hasil.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  {data.length === 0 ? 'Belum ada data pegawai.' : 'Tidak ada hasil pencarian.'}
                </td>
              </tr>
            )}
            {hasil.map((p) => (
              <tr key={p.id} className={terpilih.includes(p.id) ? 'bg-brand-surface/50' : undefined}>
                <td className="px-3 py-2">
                  <button onClick={() => toggleSatu(p.id)} aria-label={`Pilih ${p.nama}`}>
                    {terpilih.includes(p.id) ? (
                      <CheckSquare className="h-4 w-4 text-brand-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-2 text-gray-500">{p.kode ?? '-'}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{p.nama}</td>
                <td className="px-3 py-2 text-gray-600">{p.jabatan ?? '-'}</td>
                <td className="px-3 py-2 text-gray-600">{p.noHp ?? '-'}</td>
                <td className="px-3 py-2 text-gray-600">{p.email ?? '-'}</td>
                <td className="px-3 py-2 text-gray-600">
                  {p.jamMasuk || p.jamPulang ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-brand-primary" />
                      {p.jamMasuk?.slice(0, 5) ?? '--:--'} - {p.jamPulang?.slice(0, 5) ?? '--:--'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">global</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {p.akun ? (
                    <>
                      <span className="block truncate max-w-[13rem]">{p.akun.email}</span>
                      <span
                        className={`text-xs ${p.akun.passwordSudahDiubah ? 'text-emerald-600' : 'text-amber-600'}`}
                      >
                        {p.akun.passwordSudahDiubah ? 'password diubah' : 'password awal'}
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-600">belum ada akun</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {p.absensi30Hari.hadir} hadir
                  {p.absensi30Hari.telat > 0 && (
                    <span className="ml-1 text-amber-600">({p.absensi30Hari.telat} telat)</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {p.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => bukaEdit(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="h-3 w-3" />
                      Ubah
                    </button>
                    {p.akun && (
                      <button
                        onClick={() => {
                          setTerpilih([p.id])
                          void resetPassword(p)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                    {p.isActive && (
                      <button
                        onClick={() => void nonaktifkan(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <UserX className="h-3 w-3" />
                        Nonaktifkan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form tambah / ubah */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-primary">
                {editId ? 'Ubah Data Pegawai' : 'Tambah Pegawai'}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                aria-label="Tutup"
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-kode">Kode</label>
                <input id="f-kode" className={sel} value={form.kode} onChange={set('kode')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-nama">Nama Lengkap</label>
                <input id="f-nama" className={sel} value={form.nama} onChange={set('nama')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-jabatan">Jabatan</label>
                <input id="f-jabatan" className={sel} value={form.jabatan} onChange={set('jabatan')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-nohp">
                  Nomor WhatsApp <span className="text-xs text-gray-500">(untuk login)</span>
                </label>
                <input
                  id="f-nohp"
                  className={sel}
                  value={form.noHp}
                  onChange={set('noHp')}
                  placeholder="08xxxxxxxxxx"
                  inputMode="tel"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-email">Email</label>
                <input id="f-email" className={sel} value={form.email} onChange={set('email')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-nik">NIK</label>
                <input id="f-nik" className={sel} value={form.nik} onChange={set('nik')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-jk">Jenis Kelamin</label>
                <select id="f-jk" className={sel} value={form.jk} onChange={set('jk')}>
                  <option value="">-</option>
                  <option value="Laki-Laki">Laki-Laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-tmplahir">Tempat Lahir</label>
                <input id="f-tmplahir" className={sel} value={form.tmpLahir} onChange={set('tmpLahir')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-pendidikan">Pendidikan</label>
                <input id="f-pendidikan" className={sel} value={form.pendidikan} onChange={set('pendidikan')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-nikah">Status Pernikahan</label>
                <input
                  id="f-nikah"
                  className={sel}
                  value={form.statusPernikahan}
                  onChange={set('statusPernikahan')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-taun">Tahun Bergabung</label>
                <input
                  id="f-taun"
                  className={sel}
                  value={form.tahunBergabung}
                  onChange={set('tahunBergabung')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-keluarga">Kontak Keluarga</label>
                <input
                  id="f-keluarga"
                  className={sel}
                  value={form.kontakKeluarga}
                  onChange={set('kontakKeluarga')}
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-alamat">Alamat</label>
                <textarea id="f-alamat" className={sel} rows={2} value={form.alamat} onChange={set('alamat')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-jm">
                  Jam Masuk <span className="text-xs text-gray-500">(kosong = global)</span>
                </label>
                <input
                  id="f-jm"
                  type="time"
                  className={sel}
                  value={form.jamMasuk}
                  onChange={set('jamMasuk')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-jp">
                  Jam Pulang <span className="text-xs text-gray-500">(kosong = global)</span>
                </label>
                <input
                  id="f-jp"
                  type="time"
                  className={sel}
                  value={form.jamPulang}
                  onChange={set('jamPulang')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-tol">
                  Toleransi Telat (menit)
                </label>
                <input
                  id="f-tol"
                  type="number"
                  min={0}
                  max={240}
                  className={sel}
                  value={form.toleransiMenit}
                  onChange={set('toleransiMenit')}
                />
              </div>
            </div>

            {!editId && (
              <p className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                Akun login dibuat otomatis dengan password awal <strong>123456</strong>. Pegawai dapat
                menggantinya di halaman Profil Saya.
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
              >
                Batal
              </button>
              <button
                onClick={simpan}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
