'use client'
import { clsx } from 'clsx'
import { Check } from 'lucide-react'

const steps = [
  'Data Pribadi',
  'Data Keluarga',
  'Program & Kontak',
  'Upload Berkas',
  'Persetujuan',
]

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
        {steps.map((label, i) => {
          const step = i + 1
          const done = step < current
          const active = step === current
          return (
            <div key={i} className="flex flex-col items-center gap-1 z-10">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                done ? 'bg-brand-primary border-brand-primary text-white' :
                active ? 'bg-white border-brand-primary text-brand-primary' :
                'bg-white border-gray-300 text-gray-400'
              )}>
                {done ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={clsx(
                'text-xs hidden sm:block text-center',
                active ? 'text-brand-primary font-semibold' : done ? 'text-brand-primary' : 'text-gray-400'
              )}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
