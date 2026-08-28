import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-primary">Login</h1>
              <p className="text-gray-500 text-sm mt-1">Ma'had Aly Al-Imam Asy-Syathiby</p>
            </div>

            {/* PURE NATIVE HTML FORM - no JS, no fetch, no React state */}
            {/* Browser submits directly to API, API redirects with cookie */}
            <form method="POST" action="/api/auth/login" className="space-y-4">
              <Input
                label="Email"
                type="email"
                name="email"
                required
                placeholder="email@contoh.com"
              />
              <Input
                label="Password"
                type="password"
                name="password"
                required
                placeholder="Masukkan password"
                helpText="Untuk santri baru: gunakan Kode Registrasi sebagai password"
              />
              <Button type="submit" className="w-full" size="lg">
                Login
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Belum mendaftar?{' '}
              <Link href="/psb" className="text-brand-primary font-medium hover:underline">
                Daftar PSB
              </Link>
            </div>

            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Version:</strong> 20260828-login-fix-v5 (pure native form) | <strong>Build:</strong> {new Date().toISOString()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
