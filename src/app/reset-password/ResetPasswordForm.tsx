'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      toast.error('Konfirmasi password tidak sama')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, passwordConfirm }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        const errs = json.errors as Record<string, string[]> | undefined
        throw new Error(errs ? Object.values(errs)[0][0] : (json.message ?? 'Gagal memperbarui password'))
      }
      toast.success(json.message ?? 'Password berhasil diperbarui')
      router.push('/login?reset=success')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Password baru"
        type="password"
        name="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Minimal 6 karakter"
      />
      <Input
        label="Ulangi password baru"
        type="password"
        name="passwordConfirm"
        required
        minLength={6}
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        placeholder="Ulangi password baru"
      />
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Simpan password baru
      </Button>
    </form>
  )
}
