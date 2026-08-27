'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster, toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Login] Form submitted', { email })
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      console.log('[Login] Response status', res.status)
      const json = await res.json().catch((err) => {
        console.error('[Login] JSON parse error', err)
        return null
      })
      console.log('[Login] Response JSON', json)

      if (!json) {
        toast.error('Server tidak mengembalikan response valid')
        return
      }

      if (!res.ok) {
        toast.error(`HTTP ${res.status}: ${json.message ?? 'Login gagal'}`)
        console.error('[Login] HTTP error', res.status, json)
        return
      }

      if (json.success && json.data) {
        const roleId = json.data.roleId
        console.log('[Login] Success, roleId', roleId)
        toast.success(`Selamat datang, ${json.data.nama ?? 'User'}!`)
        if (roleId <= 2) {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else {
        toast.error(json.message ?? 'Login gagal - response tidak success')
        console.error('[Login] Login gagal', json)
      }
    } catch (err) {
      console.error('[Login] Exception', err)
      toast.error('Terjadi kesalahan: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster richColors />
      <Navbar />
      <main className="min-h-screen bg-brand-surface flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-primary">Login</h1>
              <p className="text-gray-500 text-sm mt-1">Ma'had Aly Al-Imam Asy-Syathiby</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@contoh.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                helpText="Untuk santri baru: gunakan Kode Registrasi sebagai password"
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Login
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Belum mendaftar?{' '}
              <Link href="/psb" className="text-brand-primary font-medium hover:underline">
                Daftar PSB
              </Link>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <p className="font-semibold mb-1">Test credentials:</p>
              <p>admin@mahadaly.syathiby.id / [REDACTED-ADMIN-PASSWORD]</p>
              <p>superadmin@mahadaly.syathiby.id / [REDACTED-ADMIN-PASSWORD]</p>
              <p>Buka DevTools (F12) → Console untuk lihat log error</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
