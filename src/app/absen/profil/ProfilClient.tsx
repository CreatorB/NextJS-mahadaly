'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, KeyRound, UserRound } from 'lucide-react'

interface Props {
  profil: {
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
    akunEmail: string | null
  }
  passwordAwal: boolean
}

export function ProfilClient({ profil, passwordAwal }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingPw, setLoadingPw] = useState(false)

  const [form, setForm] = useState({
    nama: profil.nama,
    jabatan: profil.jabatan ?? '',
    noHp: profil.noHp ?? '',
    email: profil.email ?? '',
    nik: profil.nik ?? '',
    jk: profil.jk ?? '',
    tmpLahir: profil.tmpLahir ?? '',
    pendidikan: profil.pendidikan ?? '',
    statusPernikahan: profil.statusPernikahan ?? '',
    alamat: profil.alamat ?? '',
    tahunBergabung: profil.tahunBergabung ?? '',
    kontakKeluarga: profil.kontakKeluarga ?? '',
  })

  const [pw, setPw] = useState({ lama: '', baru: '', konfirmasi: '' })

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const simpanProfil = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/absen/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Profil gagal disimpan.')
        return
      }
      toast.success(data.message ?? 'Profil tersimpan.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  const simpanPassword = async () => {
    if (pw.baru.length < 6) {
      toast.error('Password baru minimal 6 karakter.')
      return
    }
    if (pw.baru !== pw.konfirmasi) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }
    setLoadingPw(true)
    try {
      const res = await fetch('/api/absen/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordSaatIni: pw.lama, passwordBaru: pw.baru }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.message ?? 'Password gagal diubah.')
        return
      }
      toast.success(data.message ?? 'Password berhasil diubah.')
      setPw({ lama: '', baru: '', konfirmasi: '' })
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.')
    } finally {
      setLoadingPw(false)
    }
  }

  const sel = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Profil Saya</h1>
        <p className="text-sm text-gray-500">Data ini dipakai untuk absen kerja dan kontak ma&apos;had.</p>
      </div>

      {passwordAwal && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Password awal Anda masih 123456.</strong> Demi keamanan, segera ganti password di
          bawah ini.
        </div>
      )}

      {/* Data diri */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="h-5 w-5 text-brand-primary" />
          <h2 className="font-semibold text-gray-900">Data Diri</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-nama">Nama Lengkap</label>
            <input id="p-nama" className={sel} value={form.nama} onChange={set('nama')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-jabatan">Jabatan</label>
            <input id="p-jabatan" className={sel} value={form.jabatan} onChange={set('jabatan')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-nohp">
              Nomor WhatsApp <span className="text-xs text-gray-500">(dipakai login)</span>
            </label>
            <input
              id="p-nohp"
              className={sel}
              value={form.noHp}
              onChange={set('noHp')}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-email">Email</label>
            <input id="p-email" className={sel} value={form.email} onChange={set('email')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-nik">NIK</label>
            <input id="p-nik" className={sel} value={form.nik} onChange={set('nik')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-jk">Jenis Kelamin</label>
            <select id="p-jk" className={sel} value={form.jk} onChange={set('jk')}>
              <option value="">-</option>
              <option value="Laki-Laki">Laki-Laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-tmplahir">Tempat Lahir</label>
            <input id="p-tmplahir" className={sel} value={form.tmpLahir} onChange={set('tmpLahir')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-pendidikan">Pendidikan</label>
            <input id="p-pendidikan" className={sel} value={form.pendidikan} onChange={set('pendidikan')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-nikah">Status Pernikahan</label>
            <input
              id="p-nikah"
              className={sel}
              value={form.statusPernikahan}
              onChange={set('statusPernikahan')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-taun">Tahun Bergabung</label>
            <input
              id="p-taun"
              className={sel}
              value={form.tahunBergabung}
              onChange={set('tahunBergabung')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-keluarga">Kontak Keluarga</label>
            <input
              id="p-keluarga"
              className={sel}
              value={form.kontakKeluarga}
              onChange={set('kontakKeluarga')}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="p-alamat">Alamat</label>
            <textarea id="p-alamat" className={sel} rows={2} value={form.alamat} onChange={set('alamat')} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={simpanProfil}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Data
          </button>
          <p className="text-xs text-gray-500">
            Akun login (email): <span className="font-medium text-gray-700">{profil.akunEmail ?? '-'}</span>
          </p>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-primary" />
          <h2 className="font-semibold text-gray-900">Ganti Password</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="pw-lama">Password saat ini</label>
            <input
              id="pw-lama"
              type="password"
              className={sel}
              value={pw.lama}
              onChange={(e) => setPw((p) => ({ ...p, lama: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="pw-baru">Password baru</label>
            <input
              id="pw-baru"
              type="password"
              className={sel}
              value={pw.baru}
              onChange={(e) => setPw((p) => ({ ...p, baru: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="pw-konfirmasi">Ulangi password baru</label>
            <input
              id="pw-konfirmasi"
              type="password"
              className={sel}
              value={pw.konfirmasi}
              onChange={(e) => setPw((p) => ({ ...p, konfirmasi: e.target.value }))}
            />
          </div>
        </div>
        <button
          onClick={simpanPassword}
          disabled={loadingPw}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loadingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Ganti Password
        </button>
      </section>
    </div>
  )
}
