import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PsbStatusBanner } from '@/components/psb/PsbStatusBanner'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "PSB 2026 — Ma'had Aly Al-Imam Asy-Syathiby",
  description: 'Penerimaan Santri/Mahasiswa Baru Tahun Ajaran 2026/2027',
}

async function getPsbData() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const [infoRes, quotaRes] = await Promise.all([
    fetch(`${base}/api/psb/info`, { cache: 'no-store' }),
    fetch(`${base}/api/psb/quota`, { cache: 'no-store' }),
  ])
  const info = infoRes.ok ? (await infoRes.json()).data : null
  const quota = quotaRes.ok ? (await quotaRes.json()).data : { sisaIkhwan: null, sisaAkhwat: null, terdaftarIkhwan: 0, terdaftarAkhwat: 0, quotaIkhwan: null, quotaAkhwat: null }
  return { info, quota }
}

export default async function PsbPage() {
  const { info, quota } = await getPsbData()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-primary">Penerimaan Mahasiswa/i Baru</h1>
            <p className="text-gray-600 mt-2">Ma'had Aly Al-Imam Asy-Syathiby — Tahun Ajaran 2026/2027</p>
          </div>

          {info ? (
            <PsbStatusBanner info={info} quota={quota} />
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>Informasi PSB belum tersedia. Hubungi panitia di 0811-1516-756.</p>
            </div>
          )}

          <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-brand-primary mb-4">Informasi Penting</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span className="text-brand-primary font-bold">📅</span> Pendaftaran Dibuka: <strong>25 Mei 2026</strong></li>
              <li className="flex gap-2"><span className="text-brand-primary font-bold">📅</span> Pendaftaran Ditutup: <strong>19 Agustus 2026</strong></li>
              <li className="flex gap-2"><span className="text-brand-primary font-bold">📝</span> Tes Masuk: <strong>Sabtu, 22 Agustus 2026</strong></li>
              <li className="flex gap-2"><span className="text-brand-primary font-bold">💰</span> Biaya Pendaftaran: <strong>Rp 150.000</strong></li>
              <li className="flex gap-2"><span className="text-brand-primary font-bold">📞</span> Info: <strong>0811-1516-756</strong></li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sudah mendaftar? <a href="/login" className="text-brand-primary font-medium hover:underline">Login ke Dashboard</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
