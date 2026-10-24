import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LupaPasswordForm } from './LupaPasswordForm'

export const metadata = { title: 'Lupa Password — Ma\'had Aly Syathiby' }

export default function LupaPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-brand-primary">Lupa Password</h1>
              <p className="text-gray-500 text-sm mt-1">
                Untuk peserta event, Santri PSB, maupun Santri KIAS
              </p>
            </div>

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              Masukkan email yang Anda pakai saat pendaftaran. Permintaan akan masuk ke daftar admin
              (&ldquo;Pengguna &amp; Reset Password&rdquo;) dan admin akan menghubungi Anda via WhatsApp dengan
              password baru atau link reset. Mohon isi data yang sama persis dengan pendaftaran.
            </div>

            <LupaPasswordForm />

            <div className="mt-6 text-center text-sm text-gray-500">
              Sudah ingat passwordnya?{' '}
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
