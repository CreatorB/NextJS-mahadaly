'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { RegistrationFormData } from '@/lib/validations/registration'

const pendidikanOptions = [
  { value: 'SMA/SMK/MA', label: 'SMA/SMK/MA' },
  { value: 'D3/D4', label: 'D3/D4' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'Pesantren', label: 'Pesantren' },
  { value: 'Lainnya', label: 'Lainnya' },
]

interface Props {
  form: UseFormReturn<RegistrationFormData>
  programs: { id: number; namaProgram: string }[]
  pekerjaans: { id: number; nama: string }[]
}

export function Step3Program({ form, programs, pekerjaans }: Props) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Program & Data Kontak</h2>

      <Select
        label="Program Pilihan"
        required
        {...register('programId')}
        error={errors.programId?.message}
        placeholder="-- Pilih Program --"
        options={programs.map((p) => ({ value: p.id, label: p.namaProgram }))}
      />

      <Select
        label="Pendidikan Terakhir"
        required
        {...register('pendidikan')}
        error={errors.pendidikan?.message}
        placeholder="-- Pilih Pendidikan --"
        options={pendidikanOptions}
      />

      <Select
        label="Pekerjaan"
        required
        {...register('pekerjaanId')}
        error={errors.pekerjaanId?.message}
        placeholder="-- Pilih Pekerjaan --"
        options={pekerjaans.map((p) => ({ value: p.id, label: p.nama }))}
      />

      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} required placeholder="email@contoh.com" />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Kode Negara <span className="text-red-500">*</span></label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 mt-1">
            <span className="text-sm text-gray-600">+</span>
            <input {...register('kodeNegara')} defaultValue="62" className="bg-transparent text-sm w-12 focus:outline-none" />
          </div>
        </div>
        <div className="col-span-2">
          <Input label="No. WhatsApp" type="tel" {...register('noHp')} error={errors.noHp?.message} required placeholder="8xxxxxxxxxx (tanpa 0 di depan)" />
        </div>
      </div>
    </div>
  )
}
