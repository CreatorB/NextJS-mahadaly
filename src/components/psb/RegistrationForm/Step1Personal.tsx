'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import type { RegistrationFormData } from '@/lib/validations/registration'

interface Props {
  form: UseFormReturn<RegistrationFormData>
  provinsiOptions: { value: string; label: string }[]
  onProvinsiChange: (id: string) => void
  kabupatenOptions: { value: string; label: string }[]
  onKabupatenChange: (id: string) => void
  kecamatanOptions: { value: string; label: string }[]
  onKecamatanChange: (id: string) => void
}

export function Step1Personal({
  form,
  provinsiOptions,
  onProvinsiChange,
  kabupatenOptions,
  onKabupatenChange,
  kecamatanOptions,
  onKecamatanChange,
}: Props) {
  const { register, formState: { errors }, watch, setValue } = form

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Data Pribadi</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="NIK"
          {...register('nik')}
          error={errors.nik?.message}
          required
          placeholder="16 digit"
          maxLength={16}
        />
      </div>

      <Input label="Nama Lengkap" {...register('nama')} error={errors.nama?.message} required placeholder="Sesuai KTP" />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Jenis Kelamin <span className="text-red-500">*</span></label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="Laki-Laki" {...register('jk')} className="accent-brand-primary" />
            <span className="text-sm">Laki-Laki (Ikhwan)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="Perempuan" {...register('jk')} className="accent-pink-600" />
            <span className="text-sm">Perempuan (Akhwat)</span>
          </label>
        </div>
        {errors.jk && <p className="text-xs text-red-500">{errors.jk.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Tempat Lahir" {...register('tmpLahir')} error={errors.tmpLahir?.message} required placeholder="Kota kelahiran" />
        <Input label="Tanggal Lahir" type="date" {...register('tglLahir')} error={errors.tglLahir?.message} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Alamat Lengkap <span className="text-red-500">*</span></label>
        <textarea
          {...register('alamat')}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          placeholder="Jl. / Kampung. No., RT/RW"
        />
        {errors.alamat && <p className="text-xs text-red-500">{errors.alamat.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Provinsi <span className="text-red-500">*</span></label>
          <select
            {...register('provinsiId')}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors bg-white"
            onChange={(e) => {
              const val = e.target.value
              setValue('provinsiId', val, { shouldValidate: true })
              onProvinsiChange(val)
              setValue('kabupatenId', '', { shouldValidate: true })
              setValue('kecamatanId', '', { shouldValidate: true })
            }}
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinsiOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.provinsiId && <p className="text-xs text-red-500">{errors.provinsiId.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Kabupaten/Kota <span className="text-red-500">*</span></label>
          <select
            {...register('kabupatenId')}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors bg-white disabled:bg-gray-100"
            onChange={(e) => {
              const val = e.target.value
              setValue('kabupatenId', val, { shouldValidate: true })
              onKabupatenChange(val)
              setValue('kecamatanId', '', { shouldValidate: true })
            }}
            disabled={!watch('provinsiId')}
          >
            <option value="">-- Pilih Kabupaten/Kota --</option>
            {kabupatenOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.kabupatenId && <p className="text-xs text-red-500">{errors.kabupatenId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Kecamatan <span className="text-red-500">*</span></label>
          <select
            {...register('kecamatanId')}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors bg-white disabled:bg-gray-100"
            onChange={(e) => {
              const val = e.target.value
              setValue('kecamatanId', val, { shouldValidate: true })
              onKecamatanChange(val)
            }}
            disabled={!watch('kabupatenId')}
          >
            <option value="">-- Pilih Kecamatan --</option>
            {kecamatanOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.kecamatanId && <p className="text-xs text-red-500">{errors.kecamatanId.message}</p>}
        </div>
      </div>
    </div>
  )
}