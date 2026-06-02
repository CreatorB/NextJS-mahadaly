'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    setLastResult(null)

    try {
      const res = await fetch('/api/wilayah/sync')
      const data = await res.json()
      if (data.success) {
        setLastResult({
          success: true,
          message: `Berhasil sinkron! ${data.counts.provinsi} provinsi, ${data.counts.kabupaten} kabupaten, ${data.counts.kecamatan} kecamatan, ${data.counts.desa} desa.`,
        })
        toast.success('Sinkronisasi berhasil!')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setLastResult({ success: false, message: data.message ?? 'Sinkronisasi gagal' })
        toast.error('Sinkronisasi gagal')
      }
    } catch {
      setLastResult({ success: false, message: 'Terjadi kesalahan jaringan' })
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-900 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Sinkronisasi...' : 'Sinkronkan Sekarang'}
      </button>

      {lastResult && (
        <div className={`mt-4 rounded-xl p-4 text-sm ${lastResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {lastResult.message}
        </div>
      )}
    </div>
  )
}