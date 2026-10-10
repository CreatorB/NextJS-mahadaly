'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'

export function AbsensiToggle({ eventId, registrationId, hadir }: { eventId: number; registrationId: number; hadir: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const res = await fetch(`/api/admin/events/${eventId}/peserta`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'hadir', registrationId, hadir: !hadir }),
        })
        setBusy(false)
        if (res.ok) router.refresh()
        else toast.error('Gagal menyimpan absensi')
      }}
      className={`min-w-24 rounded-full px-3 py-1 text-xs font-semibold ${hadir ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
    >
      {busy ? '...' : hadir ? '✓ Hadir' : 'Tandai hadir'}
    </button>
  )
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
      <Printer className="h-4 w-4" /> Cetak
    </button>
  )
}
