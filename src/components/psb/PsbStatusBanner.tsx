'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, AlertCircle, CheckCircle, Users, CalendarX, Wallet, ArrowRight } from 'lucide-react'

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
        <div key={l} className="min-w-[70px] rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur">
          <div className="text-3xl font-bold text-brand-accent">{String(v).padStart(2, '0')}</div>
          <div className="text-sm text-blue-100">{l}</div>
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
      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-[0_12px_40px_-18px_rgba(190,18,60,0.25)]">
        <div className="bg-[linear-gradient(135deg,#9f1239,#be123c)] px-6 py-8 text-center text-white">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h2 className="text-2xl font-bold">Afwan, Pendaftaran sudah ditutup</h2>
        </div>
        <div className="px-6 py-6 text-center">
          <p className="text-gray-700">Periode pendaftaran untuk tahun ajaran ini telah berakhir.</p>
          <p className="mt-2 text-sm text-gray-500">Pantau terus informasi PMB selanjutnya melalui website ini.</p>
        </div>
      </div>
    )
  }

  if (isBeforeOpen && open) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#00367c,#00709f_70%,#35a2c9)] p-8 text-center text-white shadow-[0_14px_45px_-18px_rgba(0,54,124,0.6)]">
        <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-14 -left-12 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Clock className="h-7 w-7 text-brand-accent" />
          </span>
          <h2 className="mb-2 text-2xl font-bold">Pendaftaran Segera Dibuka</h2>
          <p className="mb-6 text-blue-100">Dibuka pada: <strong className="text-white">{open.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
          <Countdown target={open} />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-[0_14px_45px_-18px_rgba(0,54,124,0.4)]">
      {/* header */}
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#00367c,#00709f)] px-6 py-6 text-white sm:px-8">
        <div className="absolute -top-10 -right-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <CheckCircle className="h-6 w-6 text-brand-accent" />
          </span>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Pendaftaran Dibuka!</h2>
            <p className="text-sm text-blue-100">Segera daftarkan diri Anda sekarang.</p>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="p-6 sm:p-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand-surface/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/10">
              <CalendarX className="h-4 w-4 text-brand-secondary" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Batas Pendaftaran</div>
              <div className="text-sm font-semibold leading-tight text-gray-800">{closed ? closed.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand-surface/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
              <Wallet className="h-4 w-4 text-brand-primary" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Biaya Pendaftaran</div>
              <div className="text-sm font-semibold leading-tight text-gray-800">Rp {info.biayaPendaftaran.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </div>

        {(quota.quotaIkhwan != null || quota.quotaAkhwat != null) && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quota.quotaIkhwan != null && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm font-semibold text-brand-primary">Kuota Ikhwan</span>
                </div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">Terisi: {quota.terdaftarIkhwan}/{quota.quotaIkhwan}</span>
                  <span className={quota.sisaIkhwan === 0 ? 'font-bold text-rose-600' : 'font-bold text-brand-secondary'}>
                    Sisa: {quota.sisaIkhwan}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#00367c,#00709f)] transition-all"
                    style={{ width: `${Math.min(100, (quota.terdaftarIkhwan / quota.quotaIkhwan) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {quota.quotaAkhwat != null && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-600" />
                  <span className="text-sm font-semibold text-pink-700">Kuota Akhwat</span>
                </div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">Terisi: {quota.terdaftarAkhwat}/{quota.quotaAkhwat}</span>
                  <span className={quota.sisaAkhwat === 0 ? 'font-bold text-rose-600' : 'font-bold text-pink-600'}>
                    Sisa: {quota.sisaAkhwat}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#db2777,#ec4899)] transition-all"
                    style={{ width: `${Math.min(100, (quota.terdaftarAkhwat / (quota.quotaAkhwat || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <Link href="/psb/daftar" className="group inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#00367c,#00709f)] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:shadow-xl hover:shadow-brand-primary/30">
          Mulai Pendaftaran
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
