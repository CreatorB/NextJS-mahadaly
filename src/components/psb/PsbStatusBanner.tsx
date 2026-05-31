'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, AlertCircle, CheckCircle, Users } from 'lucide-react'

interface InfoPsb {
  statusPsb: string
  datetimeOpen?: string | null
  datetimeClosed?: string | null
  biayaPendaftaran: number
  quotaIkhwan?: number | null
  quotaAkhwat?: number | null
}

interface Quota {
  sisaIkhwan: number | null
  sisaAkhwat: number | null
  terdaftarIkhwan: number
  terdaftarAkhwat: number
  quotaIkhwan: number | null
  quotaAkhwat: number | null
}

interface Props {
  info: InfoPsb
  quota: Quota
}

function Countdown({ target }: { target: Date }) {
  const [diff, setDiff] = useState(target.getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])

  if (diff <= 0) return null

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)

  return (
    <div className="flex gap-4 justify-center">
      {[
        { v: days, l: 'Hari' },
        { v: hours, l: 'Jam' },
        { v: mins, l: 'Menit' },
        { v: secs, l: 'Detik' },
      ].map(({ v, l }) => (
        <div key={l} className="bg-white/20 rounded-xl px-4 py-3 text-center min-w-[70px]">
          <div className="text-3xl font-bold">{String(v).padStart(2, '0')}</div>
          <div className="text-sm text-blue-200">{l}</div>
        </div>
      ))}
    </div>
  )
}

export function PsbStatusBanner({ info, quota }: Props) {
  const now = new Date()
  const open = info.datetimeOpen ? new Date(info.datetimeOpen) : null
  const closed = info.datetimeClosed ? new Date(info.datetimeClosed) : null

  const isBeforeOpen = open && now < open
  const isAfterClose = closed && now > closed
  const isOpen = info.statusPsb === 'Buka' && !isBeforeOpen && !isAfterClose

  if (isAfterClose || info.statusPsb !== 'Buka') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Afwan, Pendaftaran sudah ditutup</h2>
        <p className="text-red-600">Periode pendaftaran untuk tahun ajaran ini telah berakhir.</p>
        <p className="text-gray-500 text-sm mt-2">Pantau terus informasi PMB selanjutnya melalui website ini.</p>
      </div>
    )
  }

  if (isBeforeOpen && open) {
    return (
      <div className="gradient-hero rounded-2xl p-8 text-white text-center">
        <Clock className="h-10 w-10 text-brand-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pendaftaran Segera Dibuka</h2>
        <p className="text-blue-200 mb-6">Pendaftaran akan dibuka pada: <strong className="text-white">{open.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
        <Countdown target={open} />
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
        <h2 className="text-2xl font-bold text-green-700">Pendaftaran Dibuka!</h2>
      </div>
      <p className="text-green-700 mb-2">
        Batas pendaftaran: <strong>{closed ? closed.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</strong>
      </p>
      <p className="text-green-600 mb-6">Biaya Pendaftaran: <strong>Rp {info.biayaPendaftaran.toLocaleString('id-ID')}</strong></p>

      {(quota.quotaIkhwan != null || quota.quotaAkhwat != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {quota.quotaIkhwan != null && (
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-brand-primary" />
                <span className="text-sm font-medium text-brand-primary">Kuota Ikhwan</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Terisi: {quota.terdaftarIkhwan}/{quota.quotaIkhwan}</span>
                <span className={quota.sisaIkhwan === 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  Sisa: {quota.sisaIkhwan}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (quota.terdaftarIkhwan / quota.quotaIkhwan) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {quota.quotaAkhwat != null && (
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-pink-600" />
                <span className="text-sm font-medium text-pink-700">Kuota Akhwat</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Terisi: {quota.terdaftarAkhwat}/{quota.quotaAkhwat}</span>
                <span className={quota.sisaAkhwat === 0 ? 'text-red-600 font-bold' : 'text-pink-600 font-bold'}>
                  Sisa: {quota.sisaAkhwat}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (quota.terdaftarAkhwat / (quota.quotaAkhwat || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Link href="/psb/daftar" className="inline-block bg-brand-primary text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-900 transition-colors shadow-md">
        Mulai Pendaftaran →
      </Link>
    </div>
  )
}
