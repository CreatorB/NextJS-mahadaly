'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Users, CalendarDays, XCircle } from 'lucide-react'
import type { CatalogProgram } from '@/lib/program-catalog'
import { formatRupiah } from '@/lib/rupiah'

type Props = {
  programs: CatalogProgram[]
  filters: { key: string; label: string; jumlah: number }[]
  totalPendaftar: number
  totalTahunIni: number
}

/**
 * Daftar program di hub /psb.
 * Filter di sisi klien (cuma handful program — tidak perlu query ulang).
 */
export function ProgramCatalogList({ programs, filters, totalPendaftar, totalTahunIni }: Props) {
  const [filter, setFilter] = useState('semua')

  const visible = useMemo(
    () => (filter === 'semua' ? programs : programs.filter((p) => p.jenisSistem === filter)),
    [filter, programs],
  )

  return (
    <>
      {/* Rekap */}
      <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-secondary text-xs font-semibold uppercase tracking-wide">
            <Users className="h-4 w-4" /> Total Pelajar
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-primary">
            {totalPendaftar.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">Santri & mahasiswa terdaftar sepanjang masa</p>
        </div>
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-secondary text-xs font-semibold uppercase tracking-wide">
            <CalendarDays className="h-4 w-4" /> Tahun Ajaran Berjalan
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-primary">
            {totalTahunIni.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">Pendaftar pada tahun ajaran aktif</p>
        </div>
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-secondary text-xs font-semibold uppercase tracking-wide">
            <CheckCircle2 className="h-4 w-4" /> Status Pendaftaran
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-primary">
            {programs.filter((p) => p.status === 'Buka').length} program dibuka
          </p>
          <p className="text-xs text-gray-500">Dari {programs.length} program yang tersedia</p>
        </div>
      </div>

      {/* Filter */}
      {filters.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">{f.jumlah.toLocaleString('id-ID')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Kartu program */}
      {visible.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Belum ada program yang ditampilkan.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {visible.map((p) => {
            const buka = p.status === 'Buka'
            const sisa = p.sisaKuota
            const totalSisa = sisa ? (sisa.ikhwan ?? 0) + (sisa.akhwat ?? 0) : null
            return (
              <article
                key={p.slug}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    {p.jenjang && (
                      <p className="text-xs font-bold tracking-widest text-brand-secondary uppercase mb-1">
                        {p.jenjang}
                      </p>
                    )}
                    <h2 className="text-xl font-bold text-brand-primary leading-tight">{p.nama}</h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      buka ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {buka ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
                  </span>
                </div>

                {p.ringkasan && <p className="text-sm text-slate-600 mb-5">{p.ringkasan}</p>}

                <dl className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-xl bg-brand-surface/70 px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Biaya Daftar</dt>
                    <dd className="text-sm font-bold text-slate-800">
                      {p.biayaDaftar != null ? formatRupiah(p.biayaDaftar) : '-'}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-brand-surface/70 px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Tahun Ajaran</dt>
                    <dd className="text-sm font-bold text-slate-800">{p.tahunAjaran ?? '-'}</dd>
                  </div>
                  <div className="rounded-xl bg-brand-surface/70 px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Terdaftar</dt>
                    <dd className="text-sm font-bold text-slate-800">
                      {p.jumlahPendaftar.toLocaleString('id-ID')} orang
                    </dd>
                  </div>
                  <div className="rounded-xl bg-brand-surface/70 px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-wide text-gray-400">Sisa Kuota</dt>
                    <dd className="text-sm font-bold text-slate-800">
                      {totalSisa == null ? '-' : `${totalSisa} kursi`}
                    </dd>
                  </div>
                </dl>

                {sisa && (sisa.ikhwan != null || sisa.akhwat != null) && (
                  <p className="mb-5 text-xs text-gray-500">
                    Sisa kuota ikhwan {sisa.ikhwan ?? '-'} &middot; akhwat {sisa.akhwat ?? '-'}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                  {buka ? (
                    <Link
                      href={p.daftarUrl}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      Daftar Sekarang
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-400">
                      <XCircle className="h-4 w-4" /> Pendaftaran Ditutup
                    </span>
                  )}
                  <Link
                    href={p.detailUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-primary/20 px-6 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 transition-colors"
                  >
                    Detail Program
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
