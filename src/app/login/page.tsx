import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email atau password salah. Silakan periksa kembali.',
  invalid: 'Data tidak valid. Pastikan email dan password terisi dengan benar.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'Terjadi kesalahan. Silakan coba lagi.' : null

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

            {errorMessage && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

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
              <strong>Version:</strong> 20260829-login-error-msg | <strong>Build:</strong> {new Date().toISOString()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
