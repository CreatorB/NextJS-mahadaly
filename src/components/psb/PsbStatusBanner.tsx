'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Clock, AlertCircle, CheckCircle, Users, ArrowRight,
  X, Share2, Wallet, Landmark, Copy,
} from 'lucide-react'

interface InfoPsb {
  statusPsb: string
  datetimeOpen?: string | null
  datetimeClosed?: string | null
  biayaPendaftaran: number
  quotaIkhwan?: number | null
  quotaAkhwat?: number | null
  posterImages?: string | null
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

function PosterSection({ src }: { src: string }) {
  const [open, setOpen] = useState(false)

  const handleShare = async () => {
    const data = {
      title: "PSB Ma'had Aly Al-Imam Asy-Syathiby",
      text: "Pendaftaran Santri/Mahasiswa Baru — Ma'had Aly Al-Imam Asy-Syathiby",
      url: typeof window !== 'undefined' ? window.location.href : '',
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share(data) } catch { /* cancelled */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(data.url)
    }
  }

  return (
    <>
      <div
        className="mb-5 cursor-pointer overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.01] active:scale-100"
        onClick={() => setOpen(true)}
        title="Klik untuk lihat poster"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Poster PSB" className="w-full object-contain" />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Poster PSB"
              className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <Share2 className="h-4 w-4" />
                Bagikan
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function PsbStatusBanner({ info, quota }: Props) {
  const now = new Date()
  const open = info.datetimeOpen ? new Date(info.datetimeOpen) : null
  const closed = info.datetimeClosed ? new Date(info.datetimeClosed) : null
  const [copied, setCopied] = useState(false)

  const isBeforeOpen = open && now < open
  const isAfterClose = closed && now > closed

  const copyNorek = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('7562929007')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

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
          <p className="mb-6 text-blue-100">
            Dibuka pada:{' '}
            <strong className="text-white">
              {open.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </strong>
          </p>
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
        {/* Poster */}
        {info.posterImages && <PosterSection src={info.posterImages} />}

        {/* Cards: Biaya (kiri) | Transfer BSI (kanan) */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Biaya Pendaftaran */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand-surface/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
              <Wallet className="h-4 w-4 text-brand-primary" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Biaya Pendaftaran</div>
              <div className="text-sm font-semibold leading-tight text-gray-800">
                Rp {info.biayaPendaftaran.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Rekening BSI */}
          <button
            onClick={copyNorek}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-brand-surface/60 px-4 py-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 w-full"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <Landmark className="h-4 w-4 text-emerald-600" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Transfer Pembayaran</div>
              <div className="text-[11px] font-semibold text-emerald-700">Bank Syariah Indonesia (BSI)</div>
              <div className="text-sm font-bold tracking-widest text-gray-800">756 2929 007</div>
              <div className="text-[11px] text-gray-500">a.n. Yayasan Cahaya Sunnah</div>
              <div className="mt-0.5 flex items-center gap-1">
                <Copy className="h-3 w-3 text-gray-400" />
                <span className={`text-[10px] transition-colors ${copied ? 'font-semibold text-emerald-600' : 'text-gray-400'}`}>
                  {copied ? 'Nomor rekening telah disalin' : 'Klik untuk salin nomor rekening'}
                </span>
              </div>
            </div>
          </button>
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

        <Link
          href="/psb/daftar"
          className="group inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#00367c,#00709f)] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:shadow-xl hover:shadow-brand-primary/30"
        >
          Mulai Pendaftaran
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
