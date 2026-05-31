'use client'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { RegistrationFormData } from '@/lib/validations/registration'

const agreements = [
  'Saya menyatakan bahwa data yang saya isi adalah benar dan dapat dipertanggungjawabkan.',
  'Saya bersedia mengikuti seluruh ketentuan dan peraturan program yang dipilih.',
  'Saya memahami bahwa pendaftaran belum final hingga diverifikasi oleh panitia.',
]

interface Props {
  form: UseFormReturn<RegistrationFormData>
  onSubmit: () => void
  isSubmitting: boolean
}

export function Step5Agreement({ form, onSubmit, isSubmitting }: Props) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false])
  const allChecked = checked.every(Boolean)
  const { getValues } = form
  const data = getValues()

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Persetujuan & Konfirmasi</h2>

      <div className="bg-brand-surface rounded-xl p-4 border border-gray-200 text-sm space-y-2">
        <h3 className="font-semibold text-brand-primary">Ringkasan Data</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
          <span className="text-gray-500">Nama:</span><span className="font-medium">{data.nama}</span>
          <span className="text-gray-500">J.Kelamin:</span><span className="font-medium">{data.jk}</span>
          <span className="text-gray-500">Tempat/Tgl Lahir:</span><span className="font-medium">{data.tmpLahir}, {data.tglLahir}</span>
          <span className="text-gray-500">Email:</span><span className="font-medium">{data.email}</span>
          <span className="text-gray-500">No. WA:</span><span className="font-medium">+{data.kodeNegara}{data.noHp}</span>
          <span className="text-gray-500">Pendidikan:</span><span className="font-medium">{data.pendidikan}</span>
        </div>
      </div>

      <div className="space-y-3">
        {agreements.map((text, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={(e) => {
                const next = [...checked]
                next[i] = e.target.checked
                setChecked(next)
              }}
              className="mt-0.5 w-4 h-4 accent-brand-primary"
            />
            <span className="text-sm text-gray-700">{text}</span>
          </label>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={!allChecked || isSubmitting}
        loading={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran'}
      </Button>
    </div>
  )
}
