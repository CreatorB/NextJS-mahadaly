'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, RotateCcw, UserX, X } from 'lucide-react'

export interface BarisPegawai {
  id: number
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
  isActive: boolean
  akun: { id: number; email: string; isActive: boolean; passwordSudahDiubah: boolean } | null
  absensi30Hari: { hadir: number; telat: number; total: number }
}

const KOSONG = {
  nama: '',
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
}

export function PegawaiClient({ data }: { data: BarisPegawai[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...KOSONG })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof KOSONG) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const hasil = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return data
    return data.filter((p) =>
      [p.nama, p.jabatan, p.noHp, p.email, p.nik]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(key)),
    )
  }, [data, q])

  const bukaTambah = () => {
    setForm({ ...KOSONG })
    setEditId(null)
    setFormOpen(true)
  }

  const bukaEdit = (p: BarisPegawai) => {
    setForm({
      nama: p.nama ?? '',
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
    })
    setEditId(p.id)
    setFormOpen(true)
  }

  const simpan = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        editId ? `/api/admin/pegawai/${editId}` : '/api/admin/pegawai',
        {
          method: editId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      )
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

  const resetPassword = async (p: BarisPegawai) => {
    if (!confirm(`Reset password ${p.nama} ke 123456?`)) return
    try {
      const res = await fetch(`/api/admin/pegawai/${p.id}/reset-password`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json?.message ?? 'Gagal reset password.')
        return
      }
      toast.success(json.message ?? 'Password direset.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    }
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

  const sel = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Data Pegawai</h1>
          <p className="text-sm text-gray-500">
            Master data staf Ma&apos;had Aly. Password awal setiap akun: <code className="rounded bg-gray-100 px-1">123456</code>
          </p>
        </div>
        <button
          onClick={bukaTambah}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Pegawai
        </button>
      </div>

      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / jabatan / WA / email..."
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              {['Nama', 'Jabatan', 'No WA', 'Email', 'Akun', 'Absen 30h', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hasil.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  {data.length === 0 ? 'Belum ada data pegawai.' : 'Tidak ada hasil pencarian.'}
                </td>
              </tr>
            )}
            {hasil.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 font-medium text-gray-900">{p.nama}</td>
                <td className="px-4 py-2 text-gray-600">{p.jabatan ?? '-'}</td>
                <td className="px-4 py-2 text-gray-600">{p.noHp ?? '-'}</td>
                <td className="px-4 py-2 text-gray-600">{p.email ?? '-'}</td>
                <td className="px-4 py-2 text-gray-600">
                  {p.akun ? (
                    <>
                      <span className="block">{p.akun.email}</span>
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
                <td className="px-4 py-2 text-gray-600">
                  {p.absensi30Hari.hadir} hadir
                  {p.absensi30Hari.telat > 0 && (
                    <span className="ml-1 text-amber-600">({p.absensi30Hari.telat} telat)</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {p.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-2">
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
                        onClick={() => resetPassword(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                    {p.isActive && (
                      <button
                        onClick={() => nonaktifkan(p)}
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
              <button onClick={() => setFormOpen(false)} aria-label="Tutup" className="rounded p-1 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 sm:col-span-2">
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
                <input id="f-nohp" className={sel} value={form.noHp} onChange={set('noHp')} placeholder="08xxxxxxxxxx" />
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
                <input id="f-nikah" className={sel} value={form.statusPernikahan} onChange={set('statusPernikahan')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-taun">Tahun Bergabung</label>
                <input id="f-taun" className={sel} value={form.tahunBergabung} onChange={set('tahunBergabung')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-keluarga">Kontak Keluarga</label>
                <input id="f-keluarga" className={sel} value={form.kontakKeluarga} onChange={set('kontakKeluarga')} />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="f-alamat">Alamat</label>
                <textarea id="f-alamat" className={sel} rows={2} value={form.alamat} onChange={set('alamat')} />
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
