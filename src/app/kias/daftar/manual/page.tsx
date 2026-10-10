import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getActiveKiasInfo, isKiasPsbOpen } from '@/lib/kias'
import { isKiasManualVerified } from '@/lib/kias-manual'
import { KiasDaftarView } from '../KiasDaftarView'
import { ManualPasswordForm } from './ManualPasswordForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pendaftaran KIAS Manual', robots: { index: false } }

export default async function KiasDaftarManualPage() {
  const info = await getActiveKiasInfo()
  if (info?.manualPassword && isKiasPsbOpen(info) && (await isKiasManualVerified(info.id))) {
    return <KiasDaftarView manual />
  }

  const pesan = !info?.manualPassword
    ? 'Pendaftaran manual sedang tidak aktif.'
    : !isKiasPsbOpen(info)
      ? 'Pendaftaran sudah ditutup.'
      : null

  return (
    <>
      <Navbar />
      <main className="bg-brand-surface py-16 px-4">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-2xl font-bold text-brand-primary">Pendaftaran KIAS Manual</h1>
          {pesan ? (
            <p className="text-slate-600">{pesan}</p>
          ) : (
            <>
              <p className="mb-6 text-sm text-slate-600">
                Khusus pendaftaran yang dibantu panitia. Masukkan password dari admin; akses berlaku 10 menit.
              </p>
              <ManualPasswordForm />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
