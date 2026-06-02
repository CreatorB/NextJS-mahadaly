import { SuccessPopup } from '@/components/psb/RegistrationForm/SuccessPopup'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Pendaftaran Berhasil — Ma'had Aly Syathiby" }

export default async function SuksesPage({ searchParams }: { searchParams: Promise<{ kode?: string; nama?: string; email?: string }> }) {
  const { kode, nama, email } = await searchParams

  if (!kode || !nama) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Valid</h1>
          <p className="text-gray-600">Silakan daftar terlebih dahulu.</p>
          <a href="/psb/daftar" className="mt-4 inline-block bg-brand-primary text-white px-6 py-2 rounded-xl hover:bg-blue-900">Daftar Sekarang</a>
        </div>
      </div>
    )
  }

  return <SuccessPopup kode={kode} nama={nama} email={decodeURIComponent(email || '')} />
}