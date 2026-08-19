'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react'

interface Program {
  id: number
  namaProgram: string
  kode: string
}

interface InfoPsb {
  statusPsb: string
  tahunAjaran: string
  isOpen: boolean
}

export default function CreateSantriPage() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [infoPsb, setInfoPsb] = useState<InfoPsb | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    nama: '',
    jk: 'Laki-Laki',
    nik: '',
    tmpLahir: '',
    tglLahir: '',
    email: '',
    kodeNegara: '62',
    noHp: '',
    alamat: '',
    namaAyah: '',
    noHpAyah: '',
    namaIbu: '',
    noHpIbu: '',
    namaWali: '',
    noHpWali: '',
    programId: '',
    pendidikan: 'SMA',
    statusPendaftaran: 'approved',
    statusTransfer: 'approved',
  })

  useEffect(() => {
    fetch('/api/program').then(r => r.json()).then(d => {
      if (d.success) setPrograms(d.data)
    })
    fetch('/api/psb/info').then(r => r.json()).then(d => {
      if (d.success) {
        const now = new Date()
        const ip = d.data
        const isOpen =
          ip.statusPsb === 'Buka' &&
          (!ip.datetimeOpen || new Date(ip.datetimeOpen) <= now) &&
          (!ip.datetimeClosed || new Date(ip.datetimeClosed) >= now)
        setInfoPsb({ ...ip, isOpen })
        if (ip.tahunAjaran) {
          setForm(f => ({ ...f }))
        }
      }
    })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.nama.trim()) { setError('Nama wajib diisi'); return }
    if (!form.programId) { setError('Program wajib dipilih'); return }
    if (!form.noHp.trim()) { setError('No HP wajib diisi'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/santri?force=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          programId: parseInt(form.programId),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(`Berhasil! Kode Registrasi: ${data.data.kodeRegistrasi}`)
        setTimeout(() => router.push('/admin/pendaftaran'), 2000)
      } else {
        setError(data.message || 'Gagal membuat pendaftaran')
      }
    } catch (e) {
      setError('Terjadi kesalahan: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-brand-primary">Tambah Pendaftaran (Susulan)</h1>
      </div>

      {infoPsb && !infoPsb.isOpen && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">PSB Sedang Ditutup</p>
              <p className="text-sm text-amber-700">
                Form ini memungkinkan admin menambahkan pendaftar meskipun PSB sudah tutup (untuk susulan / kuota dadakan).
                Tahun ajaran aktif: <strong>{infoPsb.tahunAjaran}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {infoPsb && infoPsb.isOpen && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-700">
            PSB sedang <strong>Buka</strong>. Form ini juga bisa digunakan untuk menambahkan pendaftar secara langsung.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> {success}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="font-semibold text-brand-primary">Data Pribadi</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field required label="Nama Lengkap" value={form.nama} onChange={v => setForm({ ...form, nama: v })} />
            <Select required label="Jenis Kelamin" value={form.jk} onChange={v => setForm({ ...form, jk: v })}
              options={[{ value: 'Laki-Laki', label: 'Laki-Laki' }, { value: 'Perempuan', label: 'Perempuan' }]} />
            <Field label="NIK" value={form.nik} onChange={v => setForm({ ...form, nik: v })} />
            <Field label="Tempat Lahir" value={form.tmpLahir} onChange={v => setForm({ ...form, tmpLahir: v })} />
            <Field label="Tanggal Lahir" type="date" value={form.tglLahir} onChange={v => setForm({ ...form, tglLahir: v })} />
            <Select required label="Program" value={form.programId} onChange={v => setForm({ ...form, programId: v })}
              options={programs.map(p => ({ value: String(p.id), label: p.namaProgram }))} />
            <Select label="Pendidikan Terakhir" value={form.pendidikan} onChange={v => setForm({ ...form, pendidikan: v })}
              options={[
                { value: 'SD', label: 'SD' }, { value: 'SMP', label: 'SMP' },
                { value: 'SMA', label: 'SMA' }, { value: 'D3', label: 'D3' },
                { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' },
                { value: 'S3', label: 'S3' }, { value: 'Lainnya', label: 'Lainnya' },
              ]} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-brand-primary">Kontak</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Kode Negara" value={form.kodeNegara} onChange={v => setForm({ ...form, kodeNegara: v })} />
            <div className="md:col-span-2">
              <Field required label="No HP" value={form.noHp} onChange={v => setForm({ ...form, noHp: v })} placeholder="8xxx" />
            </div>
            <div className="md:col-span-3">
              <Field label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
            </div>
            <div className="md:col-span-3">
              <Field label="Alamat" value={form.alamat} onChange={v => setForm({ ...form, alamat: v })} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-brand-primary">Orang Tua / Wali</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nama Ayah" value={form.namaAyah} onChange={v => setForm({ ...form, namaAyah: v })} />
            <Field label="No HP Ayah" value={form.noHpAyah} onChange={v => setForm({ ...form, noHpAyah: v })} />
            <Field label="Nama Ibu" value={form.namaIbu} onChange={v => setForm({ ...form, namaIbu: v })} />
            <Field label="No HP Ibu" value={form.noHpIbu} onChange={v => setForm({ ...form, noHpIbu: v })} />
            <Field label="Nama Wali" value={form.namaWali} onChange={v => setForm({ ...form, namaWali: v })} />
            <Field label="No HP Wali" value={form.noHpWali} onChange={v => setForm({ ...form, noHpWali: v })} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-brand-primary">Status Otomatis (Admin)</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Status Pendaftaran" value={form.statusPendaftaran} onChange={v => setForm({ ...form, statusPendaftaran: v })}
              options={[
                { value: 'approved', label: 'Langsung Diterima' },
                { value: 'pending', label: 'Menunggu Verifikasi' },
              ]} />
            <Select label="Status Transfer" value={form.statusTransfer} onChange={v => setForm({ ...form, statusTransfer: v })}
              options={[
                { value: 'approved', label: 'Valid' },
                { value: 'pending', label: 'Menunggu' },
              ]} />
          </div>
        </fieldset>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Menyimpan...' : 'Simpan Pendaftaran'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', required = false, placeholder = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
      />
    </div>
  )
}

function Select({
  label, value, onChange, options, required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        <option value="">-- Pilih --</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
