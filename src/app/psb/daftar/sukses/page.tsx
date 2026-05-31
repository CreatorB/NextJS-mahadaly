import Link from 'next/link'
import { CheckCircle, Copy } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Pendaftaran Berhasil — Ma'had Aly Syathiby" }

export default async function SuksesPage({ searchParams }: { searchParams: Promise<{ kode?: string; nama?: string }> }) {
  const { kode, nama } = await searchParams

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h1>
            <p className="text-gray-600 mb-6">Assalamu'alaikum <strong>{nama}</strong>, pendaftaran Anda telah diterima.</p>

            <div className="bg-brand-surface rounded-xl p-5 mb-6 border border-brand-primary/20">
              <p className="text-sm text-gray-500 mb-1">Kode Registrasi Anda</p>
              <p className="text-3xl font-bold text-brand-primary tracking-wider">{kode}</p>
              <p className="text-xs text-gray-400 mt-2">Simpan kode ini untuk login ke dashboard</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800 text-left mb-6 border border-amber-200">
              <p className="font-semibold mb-2">Langkah Selanjutnya:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Login dengan <strong>email</strong> yang Anda daftarkan</li>
                <li>Password: <strong>Kode Registrasi</strong> di atas</li>
                <li>Pantau status pendaftaran di dashboard</li>
                <li>Tunggu konfirmasi dari panitia</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/login" className="bg-brand-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-900 transition-colors">
                Login ke Dashboard
              </Link>
              <Link href="/" className="text-brand-primary font-medium hover:underline text-sm">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
