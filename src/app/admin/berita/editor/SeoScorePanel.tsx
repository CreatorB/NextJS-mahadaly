'use client'
import { clsx } from 'clsx'
import type { SeoScoreResult } from '@/lib/seo-score'
import { SeoCheckIcon } from '../SeoScoreBadge'

/**
 * Ringkasan skor SEO 0-100 beserta daftar pemeriksaan & cara memperbaikinya.
 */
export function SeoScorePanel({ hasil }: { hasil: SeoScoreResult }) {
  const warna = hasil.grade === 'good' ? 'text-green-600' : hasil.grade === 'ok' ? 'text-amber-500' : 'text-red-600'
  const ring = hasil.grade === 'good' ? 'stroke-green-500' : hasil.grade === 'ok' ? 'stroke-amber-500' : 'stroke-red-500'
  const label = hasil.grade === 'good' ? 'Bagus' : hasil.grade === 'ok' ? 'Perlu perbaikan' : 'Buruk'
  const radius = 26
  const keliling = 2 * Math.PI * radius
  const offset = keliling * (1 - hasil.score / 100)

  const gagal = hasil.checks.filter((c) => c.status === 'fail')
  const peringatan = hasil.checks.filter((c) => c.status === 'warn')
  const berlaku = hasil.checks.filter((c) => c.status !== 'na')

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90">
            <circle cx="30" cy="30" r={radius} className="fill-none stroke-gray-200" strokeWidth="6" />
            <circle
              cx="30"
              cy="30"
              r={radius}
              className={clsx('fill-none transition-all', ring)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={keliling}
              strokeDashoffset={offset}
            />
          </svg>
          <span className={clsx('absolute inset-0 flex items-center justify-center text-lg font-bold', warna)}>
            {hasil.score}
          </span>
        </div>
        <div>
          <p className={clsx('font-semibold', warna)}>Skor SEO: {label}</p>
          <p className="text-xs text-gray-500">
            {hasil.words.toLocaleString('id-ID')} kata · sekitar {hasil.readingMinutes} menit baca
          </p>
          <p className="text-xs text-gray-500">
            {berlaku.length} pemeriksaan berlaku · {gagal.length} gagal · {peringatan.length} perlu diperbaiki
          </p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {hasil.checks.map((c) => (
          <li key={c.id} className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <SeoCheckIcon status={c.status} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-500">{c.message}</p>
                {c.status !== 'pass' && c.status !== 'na' && c.fix !== '-' && (
                  <p className="mt-0.5 text-xs text-brand-secondary">→ {c.fix}</p>
                )}
              </div>
              <span className="shrink-0 text-xs tabular-nums text-gray-400">
                {c.status === 'na' ? '-' : `${c.earned}/${c.weight}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
