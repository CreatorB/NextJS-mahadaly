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
  const [debug, setDebug] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setDebug('Mengirim...')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      setDebug(`Status: ${res.status}`)
      const json = await res.json().catch(() => null)
      setDebug(`Status: ${res.status}, JSON: ${JSON.stringify(json).slice(0, 200)}`)

      if (!json) {
        toast.error('Server tidak mengembalikan response valid')
        setDebug('ERROR: json null')
        return
      }

      if (!res.ok) {
        toast.error(json.message ?? 'Login gagal')
        setDebug(`HTTP ${res.status}: ${json.message}`)
        return
      }

      if (json.success && json.data) {
        const roleId = json.data.roleId
        toast.success(`Selamat datang, ${json.data.nama ?? 'User'}!`)
        setDebug(`Success! roleId=${roleId}, redirect...`)
        if (roleId <= 2) {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else {
        toast.error(json.message ?? 'Login gagal')
        setDebug(`Failed: ${json.message}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Terjadi kesalahan: ' + msg)
      setDebug('Exception: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster richColors position="top-center" />
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

            {debug && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono text-yellow-900 break-all">
                <strong>Debug:</strong> {debug}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
