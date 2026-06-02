'use client'
import { useState } from 'react'
import { Upload, X, FileImage, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UseFormReturn } from 'react-hook-form'
import type { RegistrationFormData } from '@/lib/validations/registration'

interface FileUploadProps {
  label: string
  accept: string
  required?: boolean
  maxSize: string
  onChange: (file: File | null) => void
  error?: string
}

function FileUpload({ label, accept, required, maxSize, onChange, error }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (file: File | null) => {
    onChange(file)
    if (file) {
      setFileName(file.name)
      if (file.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(file))
      } else {
        setPreview(null)
      }
    } else {
      setFileName(null)
      setPreview(null)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        <span className="text-xs text-gray-400 ml-1">(Max {maxSize})</span>
      </label>
      {!fileName ? (
        <label className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-brand-primary transition-colors ${error ? 'border-red-400' : 'border-gray-300'}`}>
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Klik untuk upload file</p>
          <p className="text-xs text-gray-400 mt-1">{accept.includes('pdf') ? 'JPG, PNG atau PDF' : 'JPG atau PNG'}</p>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="border rounded-xl p-4 flex items-center gap-3 bg-green-50 border-green-200">
          {preview ? (
            <img src={preview} alt="preview" className="w-16 h-16 object-cover rounded-lg shrink-0" />
          ) : (
            <FileText className="h-10 w-10 text-brand-primary shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
            <p className="text-xs text-green-600">File siap diupload</p>
          </div>
          <button type="button" onClick={() => handleFile(null)} className="text-red-500 hover:text-red-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface Props {
  form: UseFormReturn<RegistrationFormData>
  onFilesChange: (files: { photo?: File; ktp?: File; transfer?: File; ijazah?: File }) => void
  fileErrors: Record<string, string>
}

export function Step4Documents({ form, onFilesChange, fileErrors }: Props) {
  const { register, formState: { errors } } = form
  const [files, setFiles] = useState<{ photo?: File; ktp?: File; transfer?: File; ijazah?: File }>({})

  const updateFile = (key: 'photo' | 'ktp' | 'transfer' | 'ijazah') => (file: File | null) => {
    const next = { ...files, [key]: file ?? undefined }
    setFiles(next)
    onFilesChange(next)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-brand-primary mb-4">Upload Berkas</h2>

      <FileUpload
        label="Pas Foto Terbaru"
        accept="image/jpeg,image/jpg,image/png"
        required
        maxSize="1 MB"
        onChange={updateFile('photo')}
        error={fileErrors.photo}
      />

      <FileUpload
        label="KTP / Kartu Identitas"
        accept="image/jpeg,image/jpg,image/png"
        required
        maxSize="1 MB"
        onChange={updateFile('ktp')}
        error={fileErrors.ktp}
      />

      <div className="space-y-4">
        <FileUpload
          label="Bukti Transfer Biaya Pendaftaran"
          accept="image/jpeg,image/jpg,image/png"
          required
          maxSize="1 MB"
          onChange={updateFile('transfer')}
          error={fileErrors.transfer}
        />
        <Input
          label="Nominal Transfer (Rp)"
          type="text"
          inputMode="numeric"
          {...register('nominalTransfer')}
          error={errors.nominalTransfer?.message}
          required
          placeholder="150000"
        />
        <p className="text-xs text-gray-500">Transfer ke rekening panitia: <a href="https://api.whatsapp.com/send?phone=628111516756" target="_blank" rel="noopener noreferrer" className="text-brand-secondary font-medium hover:underline">0811-1516-756</a> (hubungi panitia untuk konfirmasi nomor rekening)</p>
      </div>

      <FileUpload
        label="Ijazah Terakhir"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        required
        maxSize="2 MB"
        onChange={updateFile('ijazah')}
        error={fileErrors.ijazah}
      />
    </div>
  )
}
