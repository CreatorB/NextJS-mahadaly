'use client'
import { clsx } from 'clsx'
import { Check, AlertTriangle, X, Minus } from 'lucide-react'

export type SeoGrade = 'good' | 'ok' | 'bad'

export function SeoScoreBadge({ score, grade, compact = false }: { score: number; grade: SeoGrade; compact?: boolean }) {
  const warna = grade === 'good' ? 'bg-green-500' : grade === 'ok' ? 'bg-amber-500' : 'bg-red-500'
  const label = grade === 'good' ? 'Bagus' : grade === 'ok' ? 'Perlu perbaikan' : 'Buruk'
  const title = `Skor SEO ${score}/100 — ${label}`

  if (compact) {
    return (
      <span
        title={title}
        className={clsx(
          'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white',
          warna,
        )}
      >
        {score}
      </span>
    )
  }

  return (
    <span title={title} className="inline-flex items-center gap-2">
      <span className={clsx('inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white', warna)}>
        {score}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </span>
  )
}

export function SeoCheckIcon({ status }: { status: 'pass' | 'warn' | 'fail' | 'na' }) {
  if (status === 'pass') return <Check className="h-4 w-4 text-green-600" />
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500" />
  if (status === 'fail') return <X className="h-4 w-4 text-red-600" />
  return <Minus className="h-4 w-4 text-gray-300" />
}
