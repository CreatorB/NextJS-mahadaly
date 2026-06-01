import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PsbStatusBanner } from '@/components/psb/PsbStatusBanner'
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "PSB 2026 — Ma'had Aly Al-Imam Asy-Syathiby",
  description: 'Penerimaan Santri/Mahasiswa Baru Tahun Ajaran 2026/2027',
}

async function getPsbData() {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  if (!info) return { info: null, quota: null }

  const [ikhwan, akhwat] = await Promise.all([
    prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Laki-Laki' } }),
    prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Perempuan' } }),
  ])

  const quota = {
    tahunAjaran: info.tahunAjaran,
    quotaIkhwan: info.quotaIkhwan,
    quotaAkhwat: info.quotaAkhwat,
    terdaftarIkhwan: ikhwan,
    terdaftarAkhwat: akhwat,
    sisaIkhwan: info.quotaIkhwan != null ? Math.max(0, info.quotaIkhwan - ikhwan) : null,
    sisaAkhwat: info.quotaAkhwat != null ? Math.max(0, info.quotaAkhwat - akhwat) : null,
  }

  const infoForComponent = {
    statusPsb: info.statusPsb,
    datetimeOpen: info.datetimeOpen?.toISOString() ?? null,
    datetimeClosed: info.datetimeClosed?.toISOString() ?? null,
    biayaPendaftaran: info.biayaPendaftaran,
    quotaIkhwan: info.quotaIkhwan,
    quotaAkhwat: info.quotaAkhwat,
  }

  return { info: infoForComponent, quota }
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
