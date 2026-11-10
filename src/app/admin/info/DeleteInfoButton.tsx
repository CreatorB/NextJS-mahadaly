'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/** Tombol hapus halaman info di daftar admin. */
export function DeleteInfoButton({ id, judul }: { id: number; judul: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onDelete = async () => {
    if (!window.confirm(`Halaman "${judul}" akan dihapus permanen. Lanjut?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/info/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menghapus')
        return
      }
      toast.success(json.message ?? 'Halaman dihapus')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      title="Hapus"
      className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  )
}
