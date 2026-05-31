'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { RegistrationFormData } from '@/lib/validations/registration'

export function Step1Personal({ form }: { form: UseFormReturn<RegistrationFormData> }) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Data Pribadi</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="No. Induk" {...register('noInduk')} error={errors.noInduk?.message} placeholder="Opsional" />
        <Input label="NIK" {...register('nik')} error={errors.nik?.message} placeholder="16 digit (Opsional)" maxLength={16} />
        <Input label="NISN" {...register('nisn')} error={errors.nisn?.message} placeholder="10 digit (Opsional)" maxLength={10} />
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
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          placeholder="Alamat domisili saat ini"
        />
        {errors.alamat && <p className="text-xs text-red-500">{errors.alamat.message}</p>}
      </div>
    </div>
  )
}
