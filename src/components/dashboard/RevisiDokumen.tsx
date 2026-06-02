'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileImage, FileText, ExternalLink, Upload, Lock, RefreshCw } from 'lucide-react'

interface DocItem {
  key: 'photo' | 'ktp' | 'transfer' | 'ijazah'
  label: string
  accept: string
  hint: string
  path: string | null
  locked: boolean
  lockedReason?: string
}

interface Props {
  docs: DocItem[]
  canRevise: boolean
}

function DocCard({ doc, canRevise }: { doc: DocItem; canRevise: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(doc.path)

  const Icon = doc.key === 'ijazah' ? FileText : FileImage

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('field', doc.key)
      fd.append('file', file)
      const res = await fetch('/api/dashboard/revisi-berkas', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setPreviewUrl(json.data.url)
        toast.success('Berkas berhasil diperbarui')
        router.refresh()
      } else {
        toast.error(json.message ?? 'Gagal upload berkas')
      }
    } catch {
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand-primary" />
          <span className="text-sm font-medium text-gray-800">{doc.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-secondary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Lihat
            </a>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="relative">
        {previewUrl ? (
          previewUrl.endsWith('.pdf') ? (
            <iframe src={previewUrl} className="w-full h-48" title={doc.label} />
          ) : (
            <img src={previewUrl} alt={doc.label} className="w-full h-48 object-contain bg-gray-50" />
          )
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50">
            Belum diupload
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-4 py-3 border-t bg-white">
        {doc.locked ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="h-3.5 w-3.5" />
            <span>{doc.lockedReason ?? 'Berkas terkunci'}</span>
          </div>
        ) : canRevise ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={doc.accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ''
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-xs font-medium text-brand-primary hover:text-brand-secondary disabled:opacity-50 transition-colors"
            >
              {uploading
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mengupload...</>
                : <><Upload className="h-3.5 w-3.5" /> {previewUrl ? 'Ganti Berkas' : 'Upload Berkas'}</>
              }
            </button>
            <p className="text-xs text-gray-400 mt-1">{doc.hint}</p>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Berkas tidak dapat diubah</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function RevisiDokumen({ docs, canRevise }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {docs.map((doc) => (
        <DocCard key={doc.key} doc={doc} canRevise={canRevise} />
      ))}
    </div>
  )
}
