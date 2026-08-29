'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Power, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  id: number
  isActive: boolean
}

export function LinkActions({ id, isActive }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<'toggle' | 'delete' | null>(null)

  const toggle = async () => {
    setBusy('toggle')
    try {
      const res = await fetch(`/api/admin/registration-links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal mengubah status')
        return
      }
      toast.success(isActive ? 'Link dinonaktifkan' : 'Link diaktifkan')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!confirm('Yakin ingin menghapus link ini? Tindakan tidak dapat dibatalkan.')) return
    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/registration-links/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menghapus')
        return
      }
      toast.success('Link dihapus')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy !== null || pending}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
        title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
      >
        {busy === 'toggle' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy !== null || pending}
        className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
        title="Hapus"
      >
        {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  )
}
