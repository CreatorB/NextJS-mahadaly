'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { StepIndicator } from './StepIndicator'
import { Step1Personal } from './Step1Personal'
import { Step2Family } from './Step2Family'
import { Step3Program } from './Step3Program'
import { Step4Documents } from './Step4Documents'
import { Step5Agreement } from './Step5Agreement'
import { Button } from '@/components/ui/button'
import { registrationSchema, type RegistrationFormData } from '@/lib/validations/registration'

interface Props {
  programs: { id: number; namaProgram: string }[]
  pekerjaans: { id: number; nama: string }[]
}

export function RegistrationForm({ programs, pekerjaans }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<{ photo?: File; ktp?: File; transfer?: File; ijazah?: File }>({})
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { kodeNegara: '62', nominalTransfer: '150000' },
    mode: 'onChange',
  })

  const validateFiles = () => {
    const errs: Record<string, string> = {}
    if (!files.photo) errs.photo = 'Foto wajib diupload'
    if (!files.ktp) errs.ktp = 'KTP wajib diupload'
    if (!files.transfer) errs.transfer = 'Bukti transfer wajib diupload'
    if (!files.ijazah) errs.ijazah = 'Ijazah wajib diupload'
    setFileErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = async () => {
    const fields: (keyof RegistrationFormData)[] = []
    if (step === 1) fields.push('nama', 'jk', 'tmpLahir', 'tglLahir', 'alamat')
    if (step === 3) fields.push('programId', 'pendidikan', 'pekerjaanId', 'email', 'noHp')
    if (step === 4 && !validateFiles()) return

    const valid = fields.length === 0 || await form.trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    const isValid = await form.trigger()
    if (!isValid || !validateFiles()) return

    setIsSubmitting(true)
    const data = form.getValues()
    const fd = new FormData()
    for (const [k, v] of Object.entries(data)) {
      if (v != null) fd.append(k, String(v))
    }
    if (files.photo) fd.append('photo', files.photo)
    if (files.ktp) fd.append('ktp', files.ktp)
    if (files.transfer) fd.append('transfer', files.transfer)
    if (files.ijazah) fd.append('ijazah', files.ijazah)

    try {
      const res = await fetch('/api/psb/register', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        router.push(`/psb/daftar/sukses?kode=${json.data.kodeRegistrasi}&nama=${encodeURIComponent(json.data.nama)}`)
      } else {
        toast.error(json.message ?? 'Pendaftaran gagal')
        if (json.errors) {
          for (const [k, v] of Object.entries(json.errors)) {
            form.setError(k as keyof RegistrationFormData, { message: (v as string[])[0] })
          }
        }
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={step} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {step === 1 && <Step1Personal form={form} />}
        {step === 2 && <Step2Family form={form} />}
        {step === 3 && <Step3Program form={form} programs={programs} pekerjaans={pekerjaans} />}
        {step === 4 && <Step4Documents form={form} onFilesChange={setFiles} fileErrors={fileErrors} />}
        {step === 5 && <Step5Agreement form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} />}

        {step < 5 && (
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
                ← Sebelumnya
              </Button>
            )}
            <Button onClick={nextStep} className="flex-1">
              Selanjutnya →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
