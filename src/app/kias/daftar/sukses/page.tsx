import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = { title: 'Pendaftaran KIAS Berhasil', robots: { index: false } }

export default async function KiasDaftarSuksesPage({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string; nama?: string; email?: string }>
}) {
  const { kode, nama, email } = await searchParams

  return (
    <>
      <Navbar />
      <main className="bg-brand-surface py-16 px-4">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="mb-2 text-2xl font-bold text-brand-primary">Pendaftaran Berhasil</h1>
          <p className="mb-6 text-slate-600">
            {nama ? <>Jazakumullahu khairan, <strong>{nama}</strong>. </> : null}
            Pendaftaran Anda sudah kami terima dan menunggu verifikasi pembayaran.
          </p>
          {kode && (
            <div className="mb-6 rounded-2xl border-2 border-dashed border-brand-secondary bg-brand-surface p-5">
              <p className="text-sm text-slate-500">Nomor Peserta</p>
              <p className="text-4xl font-extrabold tracking-widest text-brand-primary">{kode}</p>
              <p className="mt-2 text-xs text-slate-500">Simpan nomor ini — dipakai sebagai password login.</p>
            </div>
          )}
          <div className="mb-8 rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-900">
            <p><strong>Login dashboard:</strong></p>
            <p>Email: {email ?? 'email yang Anda daftarkan'}</p>
            <p>Password: Nomor Peserta di atas</p>
          </div>
          <Link href="/login" className="inline-block rounded-xl bg-brand-primary px-8 py-3 font-semibold text-white hover:opacity-90">
            Login ke Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
