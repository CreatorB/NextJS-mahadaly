import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ResetPasswordForm } from './ResetPasswordForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Buat Password Baru — Ma\'had Aly Syathiby' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const valid = !!token && token.length >= 10

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-brand-primary">Buat Password Baru</h1>
              <p className="text-gray-500 text-sm mt-1">Link reset password hanya bisa dipakai satu kali</p>
            </div>

            {valid ? (
              <ResetPasswordForm token={token as string} />
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru ke admin.
                </div>
                <Link
                  href="/lupa-password"
                  className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Minta link reset baru
                </Link>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="text-brand-primary font-medium hover:underline">
                Kembali ke login
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
