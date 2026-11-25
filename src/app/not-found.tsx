import Link from 'next/link'
import { Home, Search } from 'lucide-react'

/**
 * Halaman 404 dengan jalan keluar (sebelumnya Next.js memakai halaman 404
 * bawaan yang tidak punya navigasi).
 */
export default function HalamanTidakDitemukan() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Search className="mx-auto h-10 w-10 text-brand-primary" />
        <h1 className="mt-4 text-2xl font-bold text-brand-primary">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-gray-600">
          Alamat yang kamu buka tidak ada atau sudah dipindahkan. Coba kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Home className="h-4 w-4" /> Kembali ke beranda
          </Link>
          <Link
            href="/berita"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Lihat Berita
          </Link>
        </div>
      </div>
    </div>
  )
}
