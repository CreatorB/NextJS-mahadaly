'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RotateCcw, TriangleAlert } from 'lucide-react'

/**
 * Error boundary global.
 *
 * Tanpa berkas ini, error saat render (mis. saat halaman dilepas / tombol
 * back) memunculkan halaman error bawaan Next.js yang tidak punya jalan keluar —
 * pengguna harus refresh manual. Di sini error ditangkap dan diberi aksi:
 * muat ulang bagian yang gagal, atau kembali ke beranda.
 */
export default function HalamanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[halaman-error]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold text-brand-primary">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-gray-600">
          Terjadi kesalahan saat memuat bagian halaman ini. Coba muat ulang, atau kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" /> Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Home className="h-4 w-4" /> Kembali ke beranda
          </Link>
        </div>
        {error.digest && <p className="mt-4 text-xs text-gray-400">Kode: {error.digest}</p>}
      </div>
    </div>
  )
}
