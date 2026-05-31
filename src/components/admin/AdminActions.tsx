'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface Props {
  kode: string
  statusPendaftaran: string
  statusTransfer: string
}

export function AdminActions({ kode, statusPendaftaran, statusTransfer }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showRejectTransfer, setShowRejectTransfer] = useState(false)
  const [showRejectPendaftaran, setShowRejectPendaftaran] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [alasanTransfer, setAlasanTransfer] = useState('')
  const [alasanPendaftaran, setAlasanPendaftaran] = useState('')

  const call = async (url: string, body?: object) => {
    setLoading(url)
    try {
      const res = await fetch(url, { method: url.includes('delete') ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        router.refresh()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(null)
      setShowRejectTransfer(false)
      setShowRejectPendaftaran(false)
      setShowDelete(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <h3 className="font-semibold text-brand-primary text-sm">Aksi Admin</h3>

      {/* Transfer Actions */}
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium">Verifikasi Pembayaran</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" disabled={statusTransfer === 'approved'} loading={loading === `/api/pendaftaran/${kode}/approve-transfer`} onClick={() => call(`/api/pendaftaran/${kode}/approve-transfer`)}>
            <CheckCircle className="h-3 w-3" /> Konfirmasi Transfer
          </Button>
          <Button size="sm" variant="danger" disabled={statusTransfer === 'rejected'} onClick={() => setShowRejectTransfer(true)}>
            <XCircle className="h-3 w-3" /> Tolak Transfer
          </Button>
        </div>
        {showRejectTransfer && (
          <div className="mt-3 space-y-2">
            <textarea value={alasanTransfer} onChange={(e) => setAlasanTransfer(e.target.value)} rows={2} placeholder="Alasan penolakan transfer (wajib)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex gap-2">
              <Button size="sm" variant="danger" loading={loading === `/api/pendaftaran/${kode}/reject-transfer`} onClick={() => call(`/api/pendaftaran/${kode}/reject-transfer`, { alasan: alasanTransfer })}>Kirim</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRejectTransfer(false)}>Batal</Button>
            </div>
          </div>
        )}
      </div>

      {/* Pendaftaran Actions */}
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium">Status Pendaftaran</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" disabled={statusPendaftaran === 'approved'} loading={loading === `/api/pendaftaran/${kode}/approve`} onClick={() => call(`/api/pendaftaran/${kode}/approve`)}>
            <CheckCircle className="h-3 w-3" /> Terima Pendaftaran
          </Button>
          <Button size="sm" variant="danger" disabled={statusPendaftaran === 'rejected'} onClick={() => setShowRejectPendaftaran(true)}>
            <XCircle className="h-3 w-3" /> Tolak Pendaftaran
          </Button>
        </div>
        {showRejectPendaftaran && (
          <div className="mt-3 space-y-2">
            <textarea value={alasanPendaftaran} onChange={(e) => setAlasanPendaftaran(e.target.value)} rows={2} placeholder="Alasan penolakan (opsional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex gap-2">
              <Button size="sm" variant="danger" loading={loading === `/api/pendaftaran/${kode}/reject`} onClick={() => call(`/api/pendaftaran/${kode}/reject`, { alasan: alasanPendaftaran })}>Kirim</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRejectPendaftaran(false)}>Batal</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="pt-2 border-t border-gray-100">
        {!showDelete ? (
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3 w-3" /> Hapus Data
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600">Yakin ingin menghapus data ini? Tindakan tidak bisa dibatalkan.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" loading={loading === `/api/pendaftaran/${kode}/delete`} onClick={() => { call(`/api/pendaftaran/${kode}/delete`).then(() => router.push('/admin/pendaftaran')) }}>Hapus</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDelete(false)}>Batal</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
