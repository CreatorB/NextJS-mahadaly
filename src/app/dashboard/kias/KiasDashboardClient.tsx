'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

export function MarkAllReadButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch('/api/kias/notifikasi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
        setBusy(false)
        router.refresh()
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
    >
      <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
    </button>
  )
}

export function RevisiBerkasForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    setBusy(true)
    setErrors({})
    try {
      const res = await fetch('/api/kias/revisi-berkas', { method: 'POST', body: new FormData(formEl) })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal mengunggah')
        return
      }
      toast.success(json.message)
      formEl.reset()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setBusy(false)
    }
  }

  const fields = [
    { name: 'buktiPembayaran', label: 'Bukti pembayaran baru' },
    { name: 'foto', label: 'Pas foto baru' },
    { name: 'ktp', label: 'KTP baru' },
  ]

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
          <input name={f.name} type="file" accept="image/jpeg,image/png" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary/10 file:px-3 file:py-1.5 file:text-brand-primary" />
          {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name][0]}</p>}
        </div>
      ))}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Kirim revisi berkas
      </button>
    </form>
  )
}
