import Link from 'next/link'
import { Newspaper, Camera, ExternalLink } from 'lucide-react'
import type { BeritaItem } from '@/lib/berita'

type Artikel = Extract<BeritaItem, { source: 'artikel' }>
type Instagram = Extract<BeritaItem, { source: 'instagram' }>

const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

/** Tinggi kartu disamakan supaya carousel rapi (embed Instagram butuh ±560px). */
export const BERITA_CARD_HEIGHT = 'h-[560px]'

export function ArtikelCard({ item }: { item: Artikel }) {
  return (
    <Link
      href={item.href}
      className={`group flex ${BERITA_CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg`}
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-brand-surface">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.judul} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary">
            <Newspaper className="h-10 w-10 text-white/60" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-primary shadow">
          <Newspaper className="h-3.5 w-3.5" /> Artikel
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-xs font-medium text-slate-500">{item.kategori} · {fmt(item.tanggal)}</p>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-brand-primary">{item.judul}</h3>
        <p className="line-clamp-4 flex-1 text-sm text-slate-600">{item.ringkasan}</p>
        <span className="mt-4 text-sm font-semibold text-brand-primary">Baca selengkapnya →</span>
      </div>
    </Link>
  )
}

export function InstagramCard({ item }: { item: Instagram }) {
  return (
    <div className={`flex ${BERITA_CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}>
      <iframe
        src={item.embedUrl}
        title={`Instagram @${item.username}`}
        loading="lazy"
        scrolling="no"
        allow="encrypted-media; picture-in-picture"
        className="w-full flex-1 border-0"
      />
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-brand-primary"
      >
        <span className="inline-flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 text-fuchsia-600" /> @{item.username} · {fmt(item.tanggal)}
        </span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

export function BeritaCard({ item }: { item: BeritaItem }) {
  return item.source === 'instagram' ? <InstagramCard item={item} /> : <ArtikelCard item={item} />
}
