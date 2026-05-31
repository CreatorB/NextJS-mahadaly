'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import type { RegistrationFormData } from '@/lib/validations/registration'

export function Step2Family({ form }: { form: UseFormReturn<RegistrationFormData> }) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Data Keluarga</h2>
      <p className="text-sm text-gray-500">Isi minimal salah satu data orang tua atau wali.</p>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Ayah</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Ayah" {...register('namaAyah')} error={errors.namaAyah?.message} placeholder="Opsional" />
          <Input label="No. HP Ayah" {...register('noHpAyah')} error={errors.noHpAyah?.message} placeholder="Opsional" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Ibu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Ibu" {...register('namaIbu')} error={errors.namaIbu?.message} placeholder="Opsional" />
          <Input label="No. HP Ibu" {...register('noHpIbu')} error={errors.noHpIbu?.message} placeholder="Opsional" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Wali (jika ada)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Wali" {...register('namaWali')} error={errors.namaWali?.message} placeholder="Opsional" />
          <Input label="No. HP Wali" {...register('noHpWali')} error={errors.noHpWali?.message} placeholder="Opsional" />
        </div>
      </div>
    </div>
  )
}
