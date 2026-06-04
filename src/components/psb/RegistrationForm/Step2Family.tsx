'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import type { RegistrationFormData } from '@/lib/validations/registration'

export function Step2Family({ form }: { form: UseFormReturn<RegistrationFormData> }) {
  const { register, formState: { errors }, watch } = form

  const hasAyah = !!(watch('namaAyah') || watch('noHpAyah'))
  const hasIbu = !!(watch('namaIbu') || watch('noHpIbu'))
  const hasWali = !!(watch('namaWali') || watch('noHpWali'))
  const familyError = !hasAyah && !hasIbu && !hasWali

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Data Keluarga</h2>
      <p className="text-sm text-gray-500">Minimal salah satu data orang tua atau wali wajib diisi (nama + no. HP).</p>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Ayah</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Ayah" {...register('namaAyah')} error={errors.namaAyah?.message} placeholder="Nama lengkap ayah" />
          <Input label="No. HP Ayah" {...register('noHpAyah')} error={errors.noHpAyah?.message} placeholder="08xxxxxxxxxx" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Ibu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Ibu" {...register('namaIbu')} error={errors.namaIbu?.message} placeholder="Nama lengkap ibu" />
          <Input label="No. HP Ibu" {...register('noHpIbu')} error={errors.noHpIbu?.message} placeholder="08xxxxxxxxxx" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Wali (jika ada)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Wali" {...register('namaWali')} error={errors.namaWali?.message} placeholder="Nama lengkap wali" />
          <Input label="No. HP Wali" {...register('noHpWali')} error={errors.noHpWali?.message} placeholder="08xxxxxxxxxx" />
        </div>
      </div>

      {familyError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Minimal salah satu data (nama + no. HP) dari Ayah, Ibu, atau Wali wajib diisi.
        </p>
      )}
    </div>
  )
}