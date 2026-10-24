'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Send, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const WA_ADMIN = '628111516756'

export function LupaPasswordForm() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/auth/lupa-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message ?? 'Gagal mengirim permintaan')
      setDone(true)
      toast.success(json.message ?? 'Permintaan terkirim')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim permintaan')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Permintaan Anda sudah tercatat.</p>
          <p className="mt-1">
            Admin akan menghubungi Anda via WhatsApp dengan link reset password (atau password baru). Mohon menunggu
            konfirmasi dari admin.
          </p>
        </div>
        <a
          href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent('Halo Admin Ma\'had Aly Syathiby, saya lupa password akun saya. Mohon bantu reset password.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4" /> Chat admin via WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@contoh.com"
        helpText="Gunakan email yang sama seperti saat pendaftaran (psb, KIAS, atau event)."
      />
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim permintaan reset
      </Button>
      <a
        href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent('Halo Admin Ma\'had Aly Syathiby, saya lupa password akun saya. Mohon bantu reset password.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <MessageCircle className="h-4 w-4" /> Lebih cepat: chat admin WhatsApp
      </a>
    </form>
  )
}
