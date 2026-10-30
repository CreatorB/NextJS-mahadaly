import Link from 'next/link'
import { after } from 'next/server'
import { ArrowRight, Camera } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getBeritaFeed, syncInstagramIfStale, type BeritaItem } from '@/lib/berita'
import { BeritaCard } from './BeritaCard'
import { BeritaCarousel, CarouselItem } from './BeritaCarousel'
import { EventCard, type EventItem } from './EventCard'

interface Props {
  /** Kategori berita yang digabung (mis. ['mahadaly', 'kias']). */
  kategori?: string[]
  /** Akun Instagram untuk tautan di header. */
  instagram?: string[]
  title?: string
  subtitle?: string
  limitBerita?: number
  limitEvent?: number
}

/**
 * Satu section "berita terbaru" untuk seluruh program: artikel + Instagram dari semua kategori
 * digabung dengan event terdekat, lalu ditampilkan dalam satu carousel.
 *
 * Dipakai di homepage (tepat setelah hero) supaya pengunjung langsung melihat kabar & agenda
 * terbaru tanpa perlu menggulir ke bawah.
 */
export async function BeritaEventSection({
  kategori = ['mahadaly', 'kias'],
  instagram = ['mahadalysyathiby', 'kias_syathiby'],
  title = 'Berita & Event Terbaru',
  subtitle = "Kabar terbaru Ma'had Aly Al-Imam Asy-Syathiby dan KIAS",
  limitBerita = 6,
  limitEvent = 3,
}: Props) {
  after(() =>
    Promise.all(
      kategori.map((k) => syncInstagramIfStale(k).catch((e) => console.error('[instagram-sync]', e))),
    ),
  )

  const [berita, events] = await Promise.all([
    getBeritaFeed({ kategori, limit: limitBerita }),
    prisma.event.findMany({
      where: { status: 'published' },
      orderBy: { startDate: 'desc' },
      take: 24,
    }),
  ])

  // Event: yang akan datang (paling dekat dulu), lalu yang terakhir berlangkah.
  const now = new Date()
  const upcoming = events
    .filter((e) => e.startDate >= now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  const past = events
    .filter((e) => e.startDate < now)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  const eventItems: EventItem[] = [...upcoming, ...past].slice(0, limitEvent)

  // Campur berita & event berselang-seling supaya keduanya langsung terlihat.
  const merged: { key: string; node: React.ReactNode }[] = []
  const max = Math.max(berita.length, eventItems.length)
  for (let i = 0; i < max; i++) {
    const b: BeritaItem | undefined = berita[i]
    if (b) {
      merged.push({
        key: b.key,
        node: <BeritaCard item={b} />,
      })
    }
    const e = eventItems[i]
    if (e) {
      merged.push({
        key: `event-${e.id}`,
        node: <EventCard item={e} />,
      })
    }
  }

  return (
    <section id="berita" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <h2 className="text-3xl font-bold text-brand-primary mb-2">{title}</h2>
            {subtitle && <p className="text-slate-600">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {instagram.map((ig) => (
              <a
                key={ig}
                href={`https://www.instagram.com/${ig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-primary hover:text-brand-primary"
              >
                <Camera className="h-4 w-4" /> @{ig}
              </a>
            ))}
            <Link
              href="/berita"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Semua berita <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {merged.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            Belum ada berita maupun event. Ikuti kabar terbaru di Instagram{' '}
            {instagram.map((ig, i) => (
              <span key={ig}>
                {i > 0 && ' dan '}
                <a href={`https://www.instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary">
                  @{ig}
                </a>
              </span>
            ))}
            .
          </p>
        ) : (
          <BeritaCarousel>
            {merged.map((m) => (
              <CarouselItem key={m.key}>{m.node}</CarouselItem>
            ))}
          </BeritaCarousel>
        )}
      </div>
    </section>
  )
}
