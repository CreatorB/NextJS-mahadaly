'use client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeletePostButton({ id, judul }: { id: number; judul: string }) {
  const router = useRouter()
  const onDelete = async () => {
    if (!window.confirm(`Hapus berita "${judul}"?`)) return
    const res = await fetch(`/api/admin/berita/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.message ?? 'Gagal menghapus')
      return
    }
    toast.success('Berita dihapus')
    router.refresh()
  }
  return (
    <button type="button" onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600" title="Hapus">
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
