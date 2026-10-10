'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'

interface ProgramOption { id: number; label: string; jenis: string; persyaratan: string | null }

interface Props {
  programs: ProgramOption[]
  pekerjaan: string[]
  pendidikan: string[]
}

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary aria-[invalid=true]:border-red-400'

function Field({ label, name, required, errors, children, hint }: {
  label: string; name: string; required?: boolean; errors: Record<string, string[]>; children: React.ReactNode; hint?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !errors[name] && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}
    </div>
  )
}

function Section({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-brand-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm text-white">{no}</span>
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function FileInput({ name, label, errors }: { name: string; label: string; errors: Record<string, string[]> }) {
  const [fileName, setFileName] = useState<string | null>(null)
  return (
    <Field label={label} name={name} required errors={errors} hint="JPG/PNG, maks 2 MB">
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 text-sm hover:border-brand-primary ${
          errors[name] ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        <UploadCloud className="h-5 w-5 shrink-0 text-brand-secondary" />
        <span className="truncate text-gray-600">{fileName ?? 'Pilih file'}</span>
        <input
          id={name}
          name={name}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
    </Field>
  )
}

export function KiasDaftarForm({ programs, pekerjaan, pendidikan }: Props) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [programId, setProgramId] = useState('')
  const selected = programs.find((p) => String(p.id) === programId)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const res = await fetch('/api/kias/daftar', { method: 'POST', body: new FormData(e.currentTarget) })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) {
          setErrors(json.errors)
          const first = Object.keys(json.errors)[0]
          document.getElementsByName(first)[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        toast.error(json.message ?? 'Pendaftaran gagal')
        return
      }
      const q = new URLSearchParams({ kode: json.data.kodeRegistrasi, nama: json.data.nama, email: json.data.email })
      router.push(`/kias/daftar/sukses?${q}`)
    } catch {
      toast.error('Terjadi kesalahan jaringan, silakan coba lagi')
    } finally {
      setSubmitting(false)
    }
  }

  const err = (name: string) => ({ 'aria-invalid': !!errors[name] || undefined })
  const jenisList = [...new Set(programs.map((p) => p.jenis))]

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Section no={1} title="Pilih Kelas">
        <div className="sm:col-span-2">
          <Field label="Kelas program" name="programId" required errors={errors}>
            <select id="programId" name="programId" value={programId} onChange={(e) => setProgramId(e.target.value)} className={input} {...err('programId')}>
              <option value="">-- Pilih kelas --</option>
              {jenisList.map((j) => (
                <optgroup key={j} label={j}>
                  {programs.filter((p) => p.jenis === j).map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          {selected?.persyaratan && <p className="mt-2 text-sm text-amber-700">Persyaratan: {selected.persyaratan}</p>}
        </div>
      </Section>

      <Section no={2} title="Data Diri">
        <div className="sm:col-span-2">
          <Field label="Nama lengkap" name="nama" required errors={errors}>
            <input id="nama" name="nama" className={input} {...err('nama')} />
          </Field>
        </div>
        <Field label="Jenis kelamin" name="jenisKelamin" required errors={errors}>
          <select id="jenisKelamin" name="jenisKelamin" className={input} {...err('jenisKelamin')}>
            <option value="">-- Pilih --</option>
            <option value="Laki-Laki">Laki-laki (Ikhwan)</option>
            <option value="Perempuan">Perempuan (Akhwat)</option>
          </select>
        </Field>
        <Field label="NIK" name="nik" required errors={errors}>
          <input id="nik" name="nik" inputMode="numeric" maxLength={16} className={input} {...err('nik')} />
        </Field>
        <Field label="Tempat lahir" name="tempatLahir" required errors={errors}>
          <input id="tempatLahir" name="tempatLahir" className={input} {...err('tempatLahir')} />
        </Field>
        <Field label="Tanggal lahir" name="tanggalLahir" required errors={errors}>
          <input id="tanggalLahir" name="tanggalLahir" type="date" className={input} {...err('tanggalLahir')} />
        </Field>
        <Field label="NISN" name="nisn" errors={errors} hint="Opsional, 10 digit">
          <input id="nisn" name="nisn" inputMode="numeric" maxLength={10} className={input} {...err('nisn')} />
        </Field>
        <Field label="Pendidikan terakhir" name="pendidikan" errors={errors}>
          <select id="pendidikan" name="pendidikan" className={input}>
            <option value="">-- Pilih --</option>
            {pendidikan.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Pekerjaan" name="pekerjaan" errors={errors}>
          <input id="pekerjaan" name="pekerjaan" list="kias-pekerjaan" className={input} />
          <datalist id="kias-pekerjaan">
            {pekerjaan.map((p) => <option key={p} value={p} />)}
          </datalist>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Alamat lengkap" name="alamat" required errors={errors}>
            <textarea id="alamat" name="alamat" rows={3} className={input} {...err('alamat')} />
          </Field>
        </div>
      </Section>

      <Section no={3} title="Kontak">
        <Field label="Email" name="email" required errors={errors} hint="Dipakai untuk login dashboard">
          <input id="email" name="email" type="email" autoComplete="email" className={input} {...err('email')} />
        </Field>
        <Field label="No. HP / WhatsApp" name="noHp" required errors={errors}>
          <input id="noHp" name="noHp" type="tel" placeholder="08xxxxxxxxxx" className={input} {...err('noHp')} />
        </Field>
      </Section>

      <Section no={4} title="Orang Tua / Wali">
        <p className="sm:col-span-2 -mt-2 text-sm text-gray-500">Isi minimal salah satu (nama + no. HP).</p>
        <Field label="Nama ayah" name="namaAyah" errors={errors}>
          <input id="namaAyah" name="namaAyah" className={input} {...err('namaAyah')} />
        </Field>
        <Field label="No. HP ayah" name="noHpAyah" errors={errors}>
          <input id="noHpAyah" name="noHpAyah" type="tel" className={input} {...err('noHpAyah')} />
        </Field>
        <Field label="Nama ibu" name="namaIbu" errors={errors}>
          <input id="namaIbu" name="namaIbu" className={input} {...err('namaIbu')} />
        </Field>
        <Field label="No. HP ibu" name="noHpIbu" errors={errors}>
          <input id="noHpIbu" name="noHpIbu" type="tel" className={input} {...err('noHpIbu')} />
        </Field>
        <Field label="Nama wali" name="namaWali" errors={errors}>
          <input id="namaWali" name="namaWali" className={input} {...err('namaWali')} />
        </Field>
        <Field label="No. HP wali" name="noHpWali" errors={errors}>
          <input id="noHpWali" name="noHpWali" type="tel" className={input} {...err('noHpWali')} />
        </Field>
      </Section>

      <Section no={5} title="Berkas">
        <FileInput name="foto" label="Pas foto" errors={errors} />
        <FileInput name="ktp" label="KTP / identitas" errors={errors} />
        <div className="sm:col-span-2">
          <FileInput name="buktiPembayaran" label="Bukti transfer biaya pendaftaran" errors={errors} />
        </div>
      </Section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-800">Saya menyatakan bahwa:</p>
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>Data yang saya isi adalah benar dan dapat dipertanggungjawabkan.</li>
          <li>Saya telah membaca dan menyetujui syarat dan ketentuan pendaftaran.</li>
          <li>Saya memahami bahwa pendaftaran belum pasti diterima sebelum proses verifikasi dan tes selesai.</li>
          <li>Uang pendaftaran yang sudah dibayarkan tidak bisa dikembalikan.</li>
        </ol>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <input type="checkbox" name="agreement" className="h-4 w-4 rounded border-gray-300" />
          Saya setuju
        </label>
        {errors.agreement && <p className="mt-1 text-xs text-red-600">{errors.agreement[0]}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Kirim Pendaftaran
        </button>
      </section>
    </form>
  )
}
