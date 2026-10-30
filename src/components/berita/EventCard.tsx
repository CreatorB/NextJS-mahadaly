import Link from 'next/link'
import { CalendarDays, Users, Sparkles } from 'lucide-react'
import { eventImages, eventImageUrl, isEventRegistrationOpen } from '@/lib/events'
import { formatRupiah } from '@/lib/rupiah'
import { BERITA_CARD_HEIGHT } from './BeritaCard'

export type EventItem = {
  id: number
  slug: string
  title: string
  startDate: Date
  endDate: Date
  images: string | null
  isPaid: boolean
  price: number
  registrationStart: Date | null
  registrationEnd: Date | null
  status: string
}

const tgl = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Kartu event untuk carousel "Berita & Event Terbaru".
 * Tingginya disamakan dengan kartu berita (BERITA_CARD_HEIGHT) supaya carousel rapi.
 */
export function EventCard({ item }: { item: EventItem }) {
  const img = eventImages(item.images)[0]
  const open = isEventRegistrationOpen(item)
  const selesai = item.endDate < new Date()

  return (
    <Link
      href={`/events/${item.slug}`}
      className={`group flex ${BERITA_CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg`}
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-brand-surface">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={eventImageUrl(img)} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary">
            <Sparkles className="h-10 w-10 text-white/60" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-primary shadow">
          <Sparkles className="h-3.5 w-3.5" /> Event
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
            open ? 'bg-emerald-500 text-white' : selesai ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'
          }`}
        >
          {open ? 'Pendaftaran dibuka' : selesai ? 'Selesai' : 'Pendaftaran ditutup'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-xs font-medium text-slate-500">Event · {tgl(item.startDate)}</p>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-brand-primary">{item.title}</h3>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4 shrink-0" /> {tgl(item.startDate)}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
          <Users className="h-4 w-4 shrink-0" /> {item.isPaid ? formatRupiah(item.price) : 'Gratis'}
        </p>
        <span className="mt-auto pt-4 text-sm font-semibold text-brand-primary">Lihat detail event →</span>
      </div>
    </Link>
  )
}
