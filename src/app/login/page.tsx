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
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use native form POST (NOT fetch) — more reliable with cookies
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/api/auth/login'

      const emailInput = document.createElement('input')
      emailInput.type = 'hidden'
      emailInput.name = 'email'
      emailInput.value = email

      const passwordInput = document.createElement('input')
      passwordInput.type = 'hidden'
      passwordInput.name = 'password'
      passwordInput.value = password

      form.appendChild(emailInput)
      form.appendChild(passwordInput)
      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setError('Terjadi kesalahan: ' + (err instanceof Error ? err.message : String(err)))
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {error}
              </div>
            )}

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

            {/* VERSION MARKER */}
            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Version:</strong> 20260828-login-fix-v4 | <strong>Build:</strong> {new Date().toISOString()}
              <br />
              Mode: <strong>Native form POST</strong> (no fetch, no React state issues)
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}