'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  open: boolean
  title: string
  onConfirm: (alasan: string) => Promise<void>
  onCancel: () => void
}

export function RejectModal({ open, title, onConfirm, onCancel }: Props) {
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    if (!alasan.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }
    setLoading(true)
    try {
      await onConfirm(alasan)
      setAlasan('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">{title}</h3>
        <textarea
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          rows={3}
          placeholder="Masukkan alasan penolakan..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button variant="danger" loading={loading} onClick={handleConfirm}>
            Konfirmasi
          </Button>
        </div>
      </div>
    </div>
  )
}