import prisma from '@/lib/prisma'
import { MapPin, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { SyncButton } from './SyncButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Wilayah — Admin' }

export default async function WilayahPage() {
  const [provCount, kabCount, kecCount, desaCount] = await Promise.all([
    prisma.provinsi.count(),
    prisma.kabupatenKota.count(),
    prisma.kecamatan.count(),
    prisma.desa.count(),
  ])

  const total = provCount + kabCount + kecCount + desaCount

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-7 w-7 text-brand-primary" />
        <h1 className="text-2xl font-bold text-brand-primary">Data Wilayah</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Provinsi</p>
          <p className="text-2xl font-bold text-brand-primary mt-1">{provCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Kabupaten/Kota</p>
          <p className="text-2xl font-bold text-brand-primary mt-1">{kabCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Kecamatan</p>
          <p className="text-2xl font-bold text-brand-primary mt-1">{kecCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Desa/Kelurahan</p>
          <p className="text-2xl font-bold text-brand-primary mt-1">{desaCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg">
        <h2 className="text-lg font-bold text-brand-primary mb-2">Sinkronisasi Data Wilayah</h2>
        <p className="text-sm text-gray-500 mb-6">
          Data diambil dari{' '}
          <a href="https://ibnux.github.io/data-indonesia" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">
            ibnux.github.io/data-indonesia
          </a>
          . Total sekitar 80.000+ record.
        </p>

        {total === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Data wilayah belum tersedia. Silakan sinkronkan terlebih dahulu.</p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">Data wilayah sudah tersedia di database ({total.toLocaleString()} record).</p>
          </div>
        )}

        <SyncButton />
      </div>
    </div>
  )
}