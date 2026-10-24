'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

interface Props {
  slug: string
  token?: string
  isPaid: boolean
  price: string | null
  loggedIn: { nama: string; email: string } | null
}

export function EventRegisterForm({ slug, token, isPaid, price, loggedIn }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [emailTaken, setEmailTaken] = useState(false)
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>
  const loginHref = `/login?next=${encodeURIComponent(token ? `/events/internal/${slug}/${token}` : `/events/${slug}`)}`

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErrors({})
        setEmailTaken(false)
        const fd = new FormData(e.currentTarget)
        if (token) fd.set('token', token)
        try {
          const res = await fetch(`/api/events/${slug}/daftar`, { method: 'POST', body: fd })
          const json = await res.json()
          if (!res.ok || !json.success) {
            if (json.errors) setErrors(json.errors)
            const emailErr = json.errors?.email?.[0] ?? ''
            if (/sudah terdaftar/i.test(emailErr)) setEmailTaken(true)
            toast.error(json.message ?? 'Pendaftaran gagal')
            return
          }
          router.push(`/events/${slug}/sukses`)
          router.refresh()
        } catch {
          toast.error('Terjadi kesalahan jaringan')
        } finally {
          setBusy(false)
        }
      }}
      className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-bold text-brand-primary">Daftar event</h2>
      {loggedIn ? (
        <p className="text-xs text-slate-500">Masuk sebagai {loggedIn.email}</p>
      ) : (
        <p className="text-xs text-slate-500">
          Sudah punya akun? <Link href={loginHref} className="font-semibold text-brand-primary">Login dulu</Link>. Belum? Akun dibuat otomatis dari formulir ini.{' '}
          <Link href="/lupa-password" className="font-semibold text-brand-primary">
            Lupa password?
          </Link>
        </p>
      )}
      <div>
        <input name="name" placeholder="Nama lengkap *" defaultValue={loggedIn?.nama} className={input} />
        {err('name')}
      </div>
      <div>
        <input name="email" type="email" placeholder="Email *" defaultValue={loggedIn?.email} readOnly={!!loggedIn} className={input} />
        {err('email')}
        {emailTaken && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Email ini sudah terdaftar.</p>
            <p className="mt-1">
              Akun ini bisa dari pendaftaran PSB/KIAS atau event sebelumnya. Silakan{' '}
              <Link href={loginHref} className="font-semibold underline">login</Link> lalu daftar event. Kalau lupa
              password,{' '}
              <Link href="/lupa-password" className="font-semibold underline">
                ajukan reset password
              </Link>{' '}
              (admin akan menghubungi via WhatsApp).
            </p>
          </div>
        )}
      </div>
      <div>
        <input name="phone" type="tel" placeholder="No. HP / WhatsApp *" className={input} />
        {err('phone')}
      </div>
      <div>
        <select name="gender" defaultValue="" className={input}>
          <option value="">Jenis kelamin *</option>
          <option value="Laki-Laki">Laki-laki (Ikhwan)</option>
          <option value="Perempuan">Perempuan (Akhwat)</option>
        </select>
        {err('gender')}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="birthPlace" placeholder="Tempat lahir" className={input} />
        <input name="birthDate" type="date" className={input} aria-label="Tanggal lahir" />
      </div>
      <input name="occupation" placeholder="Pekerjaan" className={input} />
      <textarea name="address" rows={2} placeholder="Alamat" className={input} />
      {!loggedIn && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input name="password" type="password" autoComplete="new-password" placeholder="Password *" className={input} />
            {err('password')}
          </div>
          <div>
            <input name="passwordConfirm" type="password" autoComplete="new-password" placeholder="Ulangi password *" className={input} />
            {err('passwordConfirm')}
          </div>
        </div>
      )}
      {isPaid && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bukti pembayaran {price} *</label>
          <input name="paymentProof" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" />
          {err('paymentProof')}
        </div>
      )}
      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Daftar sekarang
      </button>
    </form>
  )
}
