'use client'
import { useState } from 'react'
import { List, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import type { TocHeading } from '@/lib/toc'

/**
 * Daftar isi artikel. Di layar besar mengambang di sisi, di mobile berupa
 * panel yang bisa dibuka-tutup.
 */
export function Toc({ headings }: { headings: TocHeading[] }) {
  const [buka, setBuka] = useState(false)

  if (headings.length === 0) return null

  const isi = (
    <nav aria-label="Daftar isi">
      <ul className="space-y-1.5 border-l border-slate-200 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
            <a href={`#${h.id}`} className="block py-0.5 text-slate-600 hover:text-brand-primary">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )

  return (
    <>
      {/* Mobile: panel buka-tutup */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 xl:hidden">
        <button
          type="button"
          onClick={() => setBuka((b) => !b)}
          aria-expanded={buka}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <span className="inline-flex items-center gap-2">
            <List className="h-4 w-4" /> Daftar isi
          </span>
          <ChevronDown className={clsx('h-4 w-4 transition-transform', buka && 'rotate-180')} />
        </button>
        {buka && <div className="px-4 pb-4">{isi}</div>}
      </div>

      {/* Desktop: mengambang di sisi kiri */}
      <aside className="hidden xl:block">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <List className="h-4 w-4" /> Daftar isi
        </p>
        {isi}
      </aside>
    </>
  )
}
