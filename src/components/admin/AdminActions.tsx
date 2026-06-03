'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { StatusDropdown } from './StatusDropdown'
import { RejectModal } from './RejectModal'
import { Trash2 } from 'lucide-react'

interface Props {
  kode: string
  statusPendaftaran: string
  statusTransfer: string
  nama: string
  hp: string
  email: string
}

const WEB_URL = 'https://mahadaly.syathiby.id/login'

function waLink(hp: string, message: string): string {
  return `https://wa.me/${hp}?text=${encodeURIComponent(message)}`
}

function templateTransfer(nama: string, kode: string, email: string): string {
  return `Assalamualaikum Wr. Wb., ${nama}!

Alhamdulillah, *pembayaran pendaftaran* Anda telah berhasil *diverifikasi* ✅

🔑 Kode Registrasi: *${kode}*
📧 Email Login: ${email}
🔐 Password Default: *${kode}*

Silakan cek status pendaftaran Anda melalui:
🌐 ${WEB_URL}

_Harap segera login dan pantau terus perkembangan pendaftaran Anda._

Barakallahu fiikum 🌿
Ma'had Aly Syathiby`
}

function templatePendaftaran(nama: string, kode: string, email: string): string {
  return `Assalamualaikum Wr. Wb., ${nama}!

Alhamdulillah, *status pendaftaran* Anda telah *diperbarui* ✅

🔑 Kode Registrasi: *${kode}*
📧 Email Login: ${email}
🔐 Password Default: *${kode}*

Silakan cek status pendaftaran Anda melalui:
🌐 ${WEB_URL}

_Harap segera login dan pantau terus perkembangan pendaftaran Anda._

Barakallahu fiikum 🌿
Ma'had Aly Syathiby`
}

function WhatsAppButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      WA
    </a>
  )
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

export function AdminActions({ kode, statusPendaftaran, statusTransfer, nama, hp, email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectType, setRejectType] = useState<'pendaftaran' | 'transfer' | null>(null)
  const [showDelete, setShowDelete] = useState(false)

  const handleStatusChange = async (field: 'statusPendaftaran' | 'statusTransfer', newValue: string) => {
    if (newValue === 'rejected') {
      setRejectType(field === 'statusPendaftaran' ? 'pendaftaran' : 'transfer')
      setShowRejectModal(true)
      return
    }

    setLoading(true)
    try {
      const body: Record<string, string> = { [field]: newValue }
      const res = await fetch(`/api/pendaftaran/${kode}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
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
      setLoading(false)
    }
  }

  const handleRejectConfirm = async (alasan: string) => {
    const field = rejectType === 'pendaftaran' ? 'statusPendaftaran' : 'statusTransfer'
    setLoading(true)
    try {
      const res = await fetch(`/api/pendaftaran/${kode}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: 'rejected', [`alasan${rejectType === 'pendaftaran' ? 'Pendaftaran' : 'Transfer'}`]: alasan }),
      })
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
      setLoading(false)
      setShowRejectModal(false)
      setRejectType(null)
    }
  }

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
      setShowDelete(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <h3 className="font-semibold text-brand-primary text-sm">Aksi Admin</h3>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Verifikasi Pembayaran:</span>
            <StatusDropdown
              label=""
              value={statusTransfer}
              onChange={(val) => handleStatusChange('statusTransfer', val)}
              disabled={loading}
              options={STATUS_OPTIONS}
            />
          </div>
          <WhatsAppButton href={waLink(hp, templateTransfer(nama, kode, email))} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Status Pendaftaran:</span>
            <StatusDropdown
              label=""
              value={statusPendaftaran}
              onChange={(val) => handleStatusChange('statusPendaftaran', val)}
              disabled={loading}
              options={STATUS_OPTIONS}
            />
          </div>
          <WhatsAppButton href={waLink(hp, templatePendaftaran(nama, kode, email))} />
        </div>
      </div>

      <RejectModal
        open={showRejectModal}
        title={rejectType === 'pendaftaran' ? 'Tolak Pendaftaran' : 'Tolak Transfer'}
        onConfirm={handleRejectConfirm}
        onCancel={() => { setShowRejectModal(false); setRejectType(null) }}
      />

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