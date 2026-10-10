import Link from 'next/link'
import { after } from 'next/server'
import { ArrowRight, Camera } from 'lucide-react'
import { getBeritaFeed, syncInstagramIfStale } from '@/lib/berita'
import { BeritaCard } from './BeritaCard'
import { BeritaCarousel, CarouselItem } from './BeritaCarousel'

interface Props {
  kategori: string
  instagram: string
  title?: string
  subtitle?: string
  limit?: number
}

export async function BeritaSection({ kategori, instagram, title = 'Berita Terbaru', subtitle, limit = 9 }: Props) {
  after(() => syncInstagramIfStale(kategori).catch((e) => console.error('[instagram-sync]', e)))
  const items = await getBeritaFeed({ kategori, limit })

  return (
    <section id="berita" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <h2 className="text-3xl font-bold text-brand-primary mb-2">{title}</h2>
            {subtitle && <p className="text-slate-600">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://www.instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-primary hover:text-brand-primary"
            >
              <Camera className="h-4 w-4" /> @{instagram}
            </a>
            <Link
              href={`/berita?kategori=${kategori}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Semua berita <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            Belum ada berita. Ikuti kabar terbaru di Instagram{' '}
            <a href={`https://www.instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary">
              @{instagram}
            </a>
            .
          </p>
        ) : (
          <BeritaCarousel>
            {items.map((item) => (
              <CarouselItem key={item.key}>
                <BeritaCard item={item} />
              </CarouselItem>
            ))}
          </BeritaCarousel>
        )}
      </div>
    </section>
  )
}
